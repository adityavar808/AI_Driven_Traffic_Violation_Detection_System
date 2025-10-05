const express = require("express");
const router = express.Router();
const { createViolation, getViolations } = require("../controllers/violationController");
const Violation = require("../models/Violation");

// Officer-only routes
router.post("/", createViolation);
router.get("/", getViolations);

// Public route check violations by vehicle_no
router.get("/:vehicle_no", async (req, res) => {
  try {
    const { vehicle_no } = req.params;
    const violations = await Violation.find({ vehicle_no }).sort({ timestamp: -1 });

    if (violations.length === 0) {
      return res.json({ message: "No violations found for this vehicle" });
    }

    res.json(violations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
