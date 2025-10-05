const mongoose = require("mongoose");

const violationSchema = new mongoose.Schema({
  vehicle_no: { type: String, required: true },
  type: { type: String, enum: ["overspeed", "redlight", "seatbelt"], required: true },
  timestamp: { type: Date, default: Date.now },
  image_url: { type: String }
});

module.exports = mongoose.model("Violation", violationSchema);
