const Officer = require("../models/Officer");

// Create officer
exports.createOfficer = async (req, res) => {
  try {
    const officer = new Officer(req.body);
    await officer.save();
    res.status(201).json(officer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all officers
exports.getOfficers = async (req, res) => {
  try {
    const officers = await Officer.find();
    res.json(officers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
