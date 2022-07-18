const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const xlsx = require("xlsx");
const moment = require("moment-timezone");
const upload = require("express-fileupload");
const dotenv = require("dotenv");
const fs = require("fs");
const http = require("http");
const https = require("https");

dotenv.config();

const getFile = (filename) => {
  try {
    return fs.readFileSync(filename);
  } catch (exp) {
    console.log(exp);
    return null;
  }
};

const credentials = {
  key: getFile(process.env.PRIVATE_KEY),
  cert: getFile(process.env.CERTIFICATE),
  ca: getFile(process.env.CHAIN),
};

let middleware = require("./util/middleware.js");

const users = require("./controllers/user.controller.js");
const orders = require("./controllers/order.controller.js");

const Order = require("./models/order.model.js");

const port = process.env.PORT || 5000;
const MIN_STOCK = 50;
const PURCHASE_FACTOR = 1.25;

// INIT
const app = express();
app.options("*", cors());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());
app.use(cors());
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(
  upload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);
app.use("/assets", express.static("assets"));

mongoose.Promise = global.Promise;
moment.suppressDeprecationWarnings = true;

dbConfig = {
  url: process.env.DB_URL,
};

mongoose
  .connect(dbConfig.url, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Successfully connected to the database");
  })
  .catch((err) => {
    console.log("Could not connect to the database. Exiting now...", err);
    process.exit();
  });

app.get("/testGet", async (req, res) => {
  console.log("Pinged test GET");
  res.json({ status: "working" });
});

app.post("/testPost", async (req, res) => {
  console.log("Pinged test POST");
  console.log(req.body);
  res.json(req.body);
});

app.get("/", async (req, res) => {
  if (!req.cookies.ctToken) {
    res.redirect("/login");
  } else {
    res.redirect("/dashboard");
  }
});

app.get("/dashboard", middleware.checkToken, async (req, res) => {
  const ordersArray = await orders.findOne(req);
  res.render("dashboard", { orders: ordersArray });
});

app.get("/login", async (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  await users.checkPassword(req, res);
});

app.get("/resetPassword", async (req, res) => {
  res.render("resetPassword");
});

app.post("/resetPassword", async (req, res) => {
  await users.resetPassword(req, res);
});

app.get("/signup", async (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  await users.create(req, res);
});

app.get("/logout", async (req, res) => {
  res.clearCookie("ctToken");
  res.clearCookie("ctUsername");
  res.clearCookie("ctCompanyName");
  res.redirect("/");
});

app.get("/createOrder", middleware.checkToken, async (req, res) => {
  const user = {
    companyName: req.cookies.ctCompanyName,
  };
  res.render("createOrder", { user });
});

const getFileFromRequest = (filePath) => {
  let wb = xlsx.readFile(filePath);
  let ws = wb.Sheets["Sheet1"];
  let data = xlsx.utils.sheet_to_json(ws);
  return data;
}

const getFormattedId = (productName, manufacturer, packing) => {
  productName = productName.trim();
  manufacturer = manufacturer.trim();
  packing = packing.replaceAll(" ", "");
  const id = `${productName}$${manufacturer}$${packing}`
  return id;
}

const getInfoFromId = (id) => {
  return id.split("$");
}

app.post("/createOrder", middleware.checkToken, async (req, res) => {
  if (req.files) {
    let stockFile = req.files.stockFile.tempFilePath;
    let salesFile = req.files.salesFile.tempFilePath;
    let distributorStockFile = req.files.distributorStockFile.tempFilePath;

    let stockData = getFileFromRequest(stockFile);
    let salesData = getFileFromRequest(salesFile);
    let distributorStockData = getFileFromRequest(distributorStockFile);

    // trim all and remove spaces for packing
    let stockCollection = {};
    let salesCollection = {};
    let distributorStockCollection = {};
    let report = [];

    for (let i = 0; i < salesData.length; i++){
      const id = getFormattedId(data[i]["ProductName"], data[i]["Manufacturer"], data[i]["Packing"])
      salesCollection[id] = data[i]["Sales"]
    }

    for (let i = 0; i < distributorStockData.length; i++){
      const id = getFormattedId(data[i]["ProductName"], data[i]["Manufacturer"], data[i]["Packing"])
      distributorStockCollection[id] = data[i]["Available Stock"]
    }
    
    let counter = 0;
    for (let i = 0; i < stockData.length; i++){
      const id = getFormattedId(data[i]["ProductName"], data[i]["Manufacturer"], data[i]["Packing"])

      if (data[i]["Stock Quantity"] <= MIN_STOCK ){
        const orderQuantity = salesCollection[id] * PURCHASE_FACTOR;
        if (distributorStockCollection[id] >= orderQuantity){
          productName, manufacturer, packing = getInfoFromId(id);
          item = {
            id: counter++,
            productName,
            manufacturer,
            packing,
            orderQuantity
          }
          report.push(item);
        }
      }
    }

    const orderId = await Order.count();
    try {
      order = new Order({
        orderId,
        description: "Supplier Name Here",
        username: req.decoded.username,
        report
      });
      await order.save();
    } catch (error) {
      console.log(error);
    }
    
    res.render("error", {
      error: {
        header: `Order #${orderId} placed!`,
        message: `Total records: ${count.success + count.duplicates} - 
        Added records:  ${count.success} -
        Duplicate records: ${count.duplicates}`,
      },
    });
  } else {
    res.send("File not uploaded!");
  }
});

try {
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(443, () => {
    console.log("HTTPS Server running on port 443");
  });
} catch (exp) {
  // console.log(exp);
}

const httpServer = http.createServer(app);

httpServer.listen(port, () => {
  console.log("HTTP Server running on port " + port);
});
