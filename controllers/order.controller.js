const Order = require("../models/order.model.js");

// Retrieve and return all orders from the database.
exports.findAll = () => {
  return Order.find();
};

// Find a single order with a orderID
exports.findOne = (req) => {
  return Order.find({
    username: req.decoded.username,
  });
};

// Create and Save a new order
exports.create = async (req, res) => {
  // Create a order
  const order = new Order({
    username: req.decoded.username,
    orderID: req.body.orderID,
    description: req.body.description,
    status: req.body.status,
  });

  order
    .save()
    .then(() => {
      res.redirect("/addDevice");
    })
    .catch((err) => {
      err.success = false;
      err.message1 = err.message;
      err.message = "";
      if (err.message1.includes("orderID")) {
        err.message = err.message + "Order ID is already taken. \n";
      }
      res.render("error", {
        error: {
          header: `Multiple entry!`,
          message: `${err.keyValue.orderID} already exists!`,
        },
      });
    });
};
