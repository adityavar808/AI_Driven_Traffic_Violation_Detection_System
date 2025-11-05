const express = require("express");
const router = express.Router();
const Violation = require("../models/Violation");
const { protect, officerOnly, adminOnly } = require("../middleware/authMiddleware");

// ✅ Officer: Fetch violations by officer’s own location
router.get("/violations", protect, officerOnly, async (req, res) => {
  try {
    // 🧠 Officer info comes from auth middleware
    const location = req.officer?.location;

    if (!location) {
      return res.status(400).json({ message: "Officer location not found" });
    }

    // 🔍 Fetch violations from same location
    const violations = await Violation.find({ location });

    console.log(
      `Officer: ${req.officer.name} | Location: ${location} | Found: ${violations.length}`
    );

    res.json(violations);
  } catch (err) {
    console.error("Error fetching violations:", err);
    res.status(500).json({
      message: "Failed to fetch violations for this officer",
      error: err.message,
    });
  }
});

// ✅ Admin: Fetch all violations
router.get("/violations/all", protect, adminOnly, async (req, res) => {
  try {
    const violations = await Violation.find();
    res.json(violations);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch all violations",
      error: err.message,
    });
  }
});

module.exports = router;
