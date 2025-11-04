// seedViolations.js
const mongoose = require("mongoose");
const Officer = require("./models/Officer");
const Violation = require("./models/Violation");
require("dotenv").config();

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/traffic_db";

const violationTypes = ["overspeed", "redlight", "seatbelt"];
const images = [
  "https://picsum.photos/seed/traffic1/200/120",
  "https://picsum.photos/seed/traffic2/200/120",
  "https://picsum.photos/seed/traffic3/200/120",
  "https://picsum.photos/seed/traffic4/200/120",
];

async function seed() {
  try {
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected");

    const officers = await Officer.find();

    if (officers.length === 0) {
      console.log("⚠️ No officers found. Add officers before seeding violations.");
      return;
    }

    // 🧹 Clear previous data (optional)
    await Violation.deleteMany();
    console.log("🧹 Cleared existing violations");

    // 🔁 Create violations for each officer
    const allViolations = [];

    for (const officer of officers) {
      const location = officer.location || "Unknown City";
      console.log(`📍 Creating violations for Officer: ${officer.name} (${location})`);

      for (let i = 0; i < 6; i++) {
        const randomType = violationTypes[Math.floor(Math.random() * violationTypes.length)];
        const randomImage = images[Math.floor(Math.random() * images.length)];
        const randomVehicle = `UP-${Math.floor(10 + Math.random() * 90)}-${Math.floor(1000 + Math.random() * 9000)}`;

        const newViolation = new Violation({
          vehicle_no: randomVehicle,
          type: randomType,
          image_url: randomImage,
          location: location,
          officerId: officer._id,
        });

        allViolations.push(newViolation);
      }
    }

    await Violation.insertMany(allViolations);
    console.log(`🚔 Seeded ${allViolations.length} violations successfully!`);

    process.exit();
  } catch (err) {
    console.error("❌ Error seeding violations:", err.message);
    process.exit(1);
  }
}

seed();
