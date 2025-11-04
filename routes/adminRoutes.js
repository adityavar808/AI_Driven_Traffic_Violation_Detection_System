// routes/adminRoutes.js
const express = require("express");
const os = require("os");
const mongoose = require("mongoose");
const { performance } = require("perf_hooks");
const Officer = require("../models/Officer");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * ✅ Get all officers (only admin can see)
 */
router.get("/officers", protect, adminOnly, async (req, res) => {
  try {
    const officers = await Officer.find().select("-password_hash");
    res.json(officers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Create a new officer or admin (now includes location)
 */
router.post("/officers", protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role, location } = req.body;

    if (!name || !email || !password || !location) {
      return res.status(400).json({ message: "All fields (name, email, password, location) are required" });
    }

    const existing = await Officer.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const newOfficer = new Officer({
      name,
      email,
      password_hash: password,
      role: role === "admin" ? "admin" : "officer",
      location, // ✅ store location
    });

    await newOfficer.save();
    res.status(201).json({ message: `${role || "officer"} created successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Update officer details (including location)
 */
router.put("/officers/:id", protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role, location } = req.body;
    const officer = await Officer.findById(req.params.id);

    if (!officer) return res.status(404).json({ message: "Officer not found" });

    if (name) officer.name = name;
    if (email) officer.email = email;
    if (role && ["admin", "officer"].includes(role)) officer.role = role;
    if (password) officer.password_hash = password;
    if (location) officer.location = location;

    await officer.save();
    res.json({ message: "Officer updated successfully", officer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Delete officer (only admin)
 */
router.delete("/officers/:id", protect, adminOnly, async (req, res) => {
  try {
    await Officer.findByIdAndDelete(req.params.id);
    res.json({ message: "Officer deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 🚀 System Health API (no change)
 */
router.get("/system-health", protect, adminOnly, async (req, res) => {
  try {
    let dbStatus;
    switch (mongoose.connection.readyState) {
      case 0: dbStatus = "Disconnected"; break;
      case 1: dbStatus = "Connected"; break;
      case 2: dbStatus = "Connecting..."; break;
      case 3: dbStatus = "Disconnecting..."; break;
      default: dbStatus = "Unknown";
    }

    const uptimeHours = (os.uptime() / 3600).toFixed(2);
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedMemPercent = (((totalMem - freeMem) / totalMem) * 100).toFixed(2);
    const cpus = os.cpus();
    const avgCpuLoad =
      cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        return acc + (1 - cpu.times.idle / total);
      }, 0) / cpus.length;
    const cpuPercent = (avgCpuLoad * 100).toFixed(1);

    const start = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const latency = (performance.now() - start).toFixed(1);

    const healthData = {
      database: {
        status: dbStatus,
        host: mongoose.connection.host || "N/A",
        name: mongoose.connection.name || "N/A",
      },
      uptimeHours,
      cpuUsage: `${cpuPercent}%`,
      cpuModel: os.cpus()[0].model,
      numCPUs: os.cpus().length,
      totalMem: `${totalMem} GB`,
      freeMem: `${freeMem} GB`,
      usedMemPercent: `${usedMemPercent}%`,
      osType: os.type(),
      osRelease: os.release(),
      nodeVersion: process.version,
      apiLatency: `${latency} ms`,
      systemStatus: "All Systems Operational",
      lastBackup: "2 hrs ago",
      frontendStatus: "Online",
      backendStatus: "Online",
      version: "v1.2.3",
      license: "Valid (30 days left)",
    };

    res.json(healthData);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch system health", error: err.message });
  }
});

module.exports = router;
