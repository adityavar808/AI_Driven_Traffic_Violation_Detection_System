const Officer = require("../models/Officer");
const jwt = require("jsonwebtoken");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Register Officer
exports.registerOfficer = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const officerExists = await Officer.findOne({ email });
    if (officerExists) {
      return res.status(400).json({ message: "Officer already exists" });
    }

    const officer = await Officer.create({
      name,
      email,
      password_hash: password,
      role,
    });

    res.status(201).json({
      _id: officer._id,
      name: officer.name,
      email: officer.email,
      role: officer.role,
      token: generateToken(officer._id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login Officer
exports.loginOfficer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const officer = await Officer.findOne({ email });

    if (officer && (await officer.matchPassword(password))) {
      res.json({
        _id: officer._id,
        name: officer.name,
        email: officer.email,
        role: officer.role,
        token: generateToken(officer._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOfficerProfile = async (req, res) => {
  try {
    if (!req.officer) {
      return res.status(404).json({ message: "Officer not found" });
    }

    res.status(200).json({
      _id: req.officer._id,
      name: req.officer.name,
      email: req.officer.email,
      role: req.officer.role,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
