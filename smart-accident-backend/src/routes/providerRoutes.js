
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Provider = require("../models/Provider");

const router = express.Router();

// ========================================
// REGISTER DEVICE ADMINISTRATOR
// POST /api/provider/register
// ========================================
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingProvider = await Provider.findOne({
      email: normalizedEmail,
    });

    if (existingProvider) {
      return res.status(409).json({
        success: false,
        message: "Administrator already exists. Please log in.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const provider = await Provider.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "device-admin",
    });

    return res.status(201).json({
      success: true,
      message: "Device Administrator created successfully",
      provider: {
        id: provider._id,
        name: provider.name,
        email: provider.email,
        role: provider.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ========================================
// LOGIN DEVICE ADMINISTRATOR
// POST /api/provider/login
// ========================================
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const provider = await Provider.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (
      !provider ||
      !(await bcrypt.compare(password, provider.password))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        providerId: provider._id.toString(),
        role: "device-admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      provider: {
        id: provider._id,
        name: provider.name,
        email: provider.email,
        role: provider.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;