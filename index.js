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
const devices = require("./controllers/device.controller.js");

const Device = require("./models/device.model.js");

const port = process.env.PORT || 80;

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
  const devicesArray = await devices.findOne(req);
  res.render("dashboard", { devices: devicesArray });
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

app.get("/addDevice", middleware.checkToken, async (req, res) => {
  const user = {
    companyName: req.cookies.ctCompanyName,
  };
  res.render("addDevice", { user });
});

app.post("/addSingleDevice", middleware.checkToken, async (req, res) => {
  await devices.create(req, res);
});

app.post("/addMultipleDevices", middleware.checkToken, async (req, res) => {
  let count = {
    success: 0,
    duplicates: 0,
  };
  if (req.files) {
    let file = req.files.deviceFile.tempFilePath;
    let wb = xlsx.readFile(file);
    let ws = wb.Sheets["Sheet1"];
    let data = xlsx.utils.sheet_to_json(ws);
    let device;
    for (let i = 0; i < data.length; i++) {
      try {
        device = new Device({
          username: req.decoded.username,
          deviceID: data[i].DeviceID,
          description: data[i].Description,
        });
        await device.save();
        count.success++;
      } catch (error) {
        count.duplicates++;
      }
    }
    res.render("error", {
      error: {
        header: "Added records!",
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
  console.log(exp);
}

const httpServer = http.createServer(app);

httpServer.listen(port, () => {
  console.log("HTTP Server running on port " + port);
});
