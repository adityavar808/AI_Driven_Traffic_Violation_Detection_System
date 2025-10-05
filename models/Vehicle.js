const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  vehicle_no: { type: String, required: true, unique: true },
  owner_name: { type: String, required: true },
  owner_contact: { type: String }
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
