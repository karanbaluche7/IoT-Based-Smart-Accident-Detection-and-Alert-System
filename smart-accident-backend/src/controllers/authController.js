const Hospital = require("../models/Hospital");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ===============================
// Register Hospital
// ===============================
const registerHospital = async (req, res) => {
  try {
    const {
      hospitalName,
      email,
      password,
      phone,
      address,
      latitude,
      longitude,
    } = req.body;

    // Check required fields
    if (
      !hospitalName ||
      !email ||
      !password ||
      !phone ||
      !address ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    // Check if hospital already exists
    const hospitalExists = await Hospital.findOne({ email });

    if (hospitalExists) {
      return res.status(409).json({
        success: false,
        message: "Hospital already registered.",
      });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Hospital
    const hospital = await Hospital.create({
      hospitalName,
      email,
      password: hashedPassword,
      phone,
      address,
      latitude,
      longitude,
    });

    res.status(201).json({
      success: true,
      message: "Hospital registered successfully.",
      hospital: {
        id: hospital._id,
        hospitalName: hospital.hospitalName,
        email: hospital.email,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ===============================
// Login Hospital
// ===============================
const loginHospital = async (req, res) => {
  try {
    const { email, password } = req.body;

    const hospital = await Hospital.findOne({ email });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found.",
      });
    }

    const isMatch = await bcrypt.compare(password, hospital.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: hospital._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      hospital: {
        id: hospital._id,
        hospitalName: hospital.hospitalName,
        email: hospital.email,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  registerHospital,
  loginHospital,
};