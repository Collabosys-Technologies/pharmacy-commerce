const Device = require("../models/device.model.js");

// Retrieve and return all devices from the database.
exports.findAll = () => {
  return Device.find();
};

// Find a single device with a deviceID
exports.findOne = (req) => {
  return Device.find({
    username: req.decoded.username,
  });
};

// Create and Save a new device
exports.create = async (req, res) => {
  // Create a device
  const device = new Device({
    username: req.decoded.username,
    deviceID: req.body.deviceID,
    description: req.body.description,
    status: req.body.status,
  });

  device
    .save()
    .then(() => {
      res.redirect("/addDevice");
    })
    .catch((err) => {
      err.success = false;
      err.message1 = err.message;
      err.message = "";
      if (err.message1.includes("deviceID")) {
        err.message = err.message + "Device ID is already taken. \n";
      }
      res.render("error", {
        error: {
          header: `Multiple entry!`,
          message: `${err.keyValue.deviceID} already exists!`,
        },
      });
    });
};
