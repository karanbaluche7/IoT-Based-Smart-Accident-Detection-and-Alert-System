require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Provider = require("../models/Provider");

async function createProvider() {
  try {
    // Use your existing .env variable
    await mongoose.connect(process.env.MONGODB_URI);

    const email = "admin@example.com";
    const password = "ChangeThis@123";

    const existing = await Provider.findOne({ email });

    if (existing) {
      console.log("Device Administrator account already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await Provider.create({
      name: "Device Administrator",
      email,
      password: hashedPassword,
      role: "device-admin",
    });

    console.log("Device Administrator created successfully.");
    console.log("Email:", email);
    console.log("Password:", password);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createProvider();