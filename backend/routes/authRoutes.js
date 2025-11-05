const express = require("express");
const { registerOfficer, loginOfficer } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const Officer = require("../models/Officer");

const router = express.Router();

// Register & Login
router.post("/register", registerOfficer);
router.post("/login", loginOfficer);

// ✅ New route to get logged-in officer info
router.get("/me", protect, async (req, res) => {
  try {
    // req.officer.id is set by protect middleware
    const officer = await Officer.findById(req.officer.id).select("name email role");
    if (!officer) {
      return res.status(404).json({ message: "Officer not found" });
    }
    res.json(officer); // { name: "test officer", email: "...", role: "officer" }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
