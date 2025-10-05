const express = require("express");
const { registerOfficer, loginOfficer } = require("../controllers/authController");
const router = express.Router();

router.post("/register", registerOfficer);
router.post("/login", loginOfficer);

module.exports = router;
