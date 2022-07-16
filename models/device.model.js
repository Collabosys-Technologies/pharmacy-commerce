const mongoose = require("mongoose");

var Schema = mongoose.Schema;

var deviceSchema = new Schema(
  {
    deviceID: {
      type: String,
      unique: true,
      required: [true, "can't be blank"],
      index: true,
    },
    description: String,
    username: String,
    status: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Device", deviceSchema);
