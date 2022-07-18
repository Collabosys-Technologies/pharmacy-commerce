const mongoose = require("mongoose");
const Report = require("./report.model");

var Schema = mongoose.Schema;

var orderSchema = new Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: [true, "can't be blank"],
      index: true,
    },
    description: String,
    username: String,
    report: [{
      type: Schema.ObjectId,
      ref: 'Report'
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
