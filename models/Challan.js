const mongoose = require("mongoose");

const challanSchema = new mongoose.Schema({
  violation_id: { type: mongoose.Schema.Types.ObjectId, ref: "Violation", required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["paid", "unpaid"], default: "unpaid" },
  issue_date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Challan", challanSchema);
