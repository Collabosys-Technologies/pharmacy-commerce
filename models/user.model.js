const mongoose = require("mongoose");

var Schema = mongoose.Schema;

var userSchema = new Schema(
  {
    username: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "can't be blank"],
      index: true,
    },
    password: String,
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "can't be blank"],
      index: true,
    },
    phone: String,
    contactPersonal: String,
    position: String,
    companyName: String,
    companyAddress: String,
    country: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
