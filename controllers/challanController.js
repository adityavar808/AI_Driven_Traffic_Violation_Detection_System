const Challan = require("../models/Challan");

// Create challan
exports.createChallan = async (req, res) => {
  try {
    const challan = new Challan(req.body);
    await challan.save();
    res.status(201).json(challan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all challans
exports.getChallans = async (req, res) => {
  try {
    const challans = await Challan.find().populate("violation_id");
    res.json(challans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
