const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const officerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ["admin", "officer"], default: "officer" },
  password_hash: { type: String, required: true },
  image_url: { type: String, default: "/officer.jpg" } 
});

// Hash password before saving
officerSchema.pre("save", async function (next) {
  if (!this.isModified("password_hash")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  next();
});

// Compare password
officerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password_hash);
};

module.exports = mongoose.model("Officer", officerSchema);