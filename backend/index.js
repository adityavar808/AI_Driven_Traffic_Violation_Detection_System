const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./db/connect");

const authRoutes = require("./routes/authRoutes");
const violationRoutes = require("./routes/violationRoutes");
const officerRoutes = require("./routes/officerRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const challanRoutes = require("./routes/challanRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");

const { protect } = require("./middleware/authMiddleware");


const app = express();
app.use(cors());
app.use(express.json());

// Public routes
app.use("/auth", authRoutes);
app.use("/officer", officerRoutes);
app.use("/vehicles", vehicleRoutes);
app.use("/challans/check", challanRoutes);
app.use("/challans/:id/pay", challanRoutes);

// Public violation check
app.use("/violations/check", violationRoutes);

// Protected routes
app.use("/violations", protect, violationRoutes);
app.use("/challans", protect, challanRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/admin", adminRoutes);


const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error(error);
  }
};
start();