const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: "../.env" }); // 👈 this line is important
const Officer = require("../models/Officer");

async function createAdmin() {
  try {
    console.log("Connecting to:", process.env.MONGO_URI); // should now show your Mongo URI

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const existingAdmin = await Officer.findOne({ email: "admin@ai.com" });
    if (existingAdmin) {
      console.log("⚠️ Admin already exists.");
      process.exit(0);
    }

    const passwordHash = "admin"; // plain text, will be hashed in pre-save hook


    const admin = new Officer({
      name: "System Admin",
      email: "admin@ai.com",
      password_hash: passwordHash,
      role: "admin",
    });

    await admin.save();
    console.log("✅ Admin user created successfully!");
    console.log("Email:", admin.email);
    console.log("Password: admin");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
    process.exit(1);
  }
}

createAdmin();
