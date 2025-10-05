const express = require("express");
const router = express.Router();
const { createChallan, getChallans } = require("../controllers/challanController");
const Challan = require("../models/Challan");

// Officer routes
router.post("/", createChallan);
router.get("/", getChallans);

// Public route check challans by vehicle number
router.get("/check/:vehicle_no", async (req, res) => {
  try {
    const { vehicle_no } = req.params;

    const challans = await Challan.find()
      .populate({
        path: "violation_id",
        match: { vehicle_no: vehicle_no }
      });

    // Filter only challans where violation matched
    const vehicleChallans = challans.filter(c => c.violation_id !== null);

    if (vehicleChallans.length === 0) {
      return res.json({ message: "No challans found for this vehicle" });
    }

    res.json(vehicleChallans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
