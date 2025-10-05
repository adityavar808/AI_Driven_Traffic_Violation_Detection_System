const express = require("express");
const router = express.Router();
const { createOfficer, getOfficers } = require("../controllers/officerController");

router.post("/", createOfficer);
router.get("/", getOfficers);

module.exports = router;
