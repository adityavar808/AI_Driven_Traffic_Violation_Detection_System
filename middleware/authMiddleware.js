const jwt = require("jsonwebtoken");
const Officer = require("../models/Officer");

// ✅ Protect middleware — verifies token & attaches officer info
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ Find officer from DB and attach to req.officer
      req.officer = await Officer.findById(decoded.id).select("-password_hash");

      if (!req.officer) {
        return res.status(401).json({ message: "Officer not found" });
      }

      next();
    } catch (err) {
      console.error("Auth error:", err.message);
      res.status(401).json({ message: "Not authorized, token invalid" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

// ✅ Admin-only access
const adminOnly = (req, res, next) => {
  if (req.officer && req.officer.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Admins only" });
  }
};

// ✅ Officer-only access
const officerOnly = (req, res, next) => {
  if (req.officer && req.officer.role === "officer") {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Officers only" });
  }
};

module.exports = { protect, adminOnly, officerOnly };
