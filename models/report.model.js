const mongoose = require("mongoose");

var Schema = mongoose.Schema;

var reportSchema = new Schema(
  {
    id: Number,
    productName: String,
    manufacturer: String,
    packing: String,
    orderQuantity: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
