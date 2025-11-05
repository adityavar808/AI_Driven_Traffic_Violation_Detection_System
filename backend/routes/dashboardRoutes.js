const express = require("express");
const { protect, adminOnly, officerOnly } = require("../middleware/authMiddleware");
const router = express.Router();

// Officer dashboard
router.get("/officer", protect, officerOnly, (req, res) => {
  res.json({
    message: "Welcome to Officer Dashboard",
    officer: req.officer.name,
  });
});

// Admin dashboard
router.get("/admin", protect, adminOnly, (req, res) => {
  res.json({
    message: "Welcome to Admin Dashboard",
    officer: req.officer.name,
  });
});

module.exports = router;
