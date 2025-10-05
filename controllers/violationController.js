const Violation = require("../models/Violation");

// Create a new violation (Officer-only)
exports.createViolation = async (req, res) => {
  try {
    const violation = new Violation(req.body);
    await violation.save();
    res.status(201).json(violation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all violations (Officer-only, optional filter by vehicle_no)
exports.getViolations = async (req, res) => {
  try {
    const { vehicle_no } = req.query;
    let filter = {};

    if (vehicle_no) {
      filter.vehicle_no = vehicle_no;
    }

    const violations = await Violation.find(filter).sort({ timestamp: -1 });
    res.json(violations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
