const Hospital = require("../models/Hospital");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// =====================================
// Hospital Login
// =====================================
const loginHospital = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Find hospital
    const hospital = await Hospital.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!hospital) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(
      password,
      hospital.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check active status
    if (hospital.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Hospital account is inactive.",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: hospital._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      hospital: {
        id: hospital._id,
        hospitalName: hospital.hospitalName,
        email: hospital.email,
        phone: hospital.phone,
        address: hospital.address,
        latitude: hospital.latitude,
        longitude: hospital.longitude,
        isActive: hospital.isActive,
      },
    });
  } catch (error) {
    console.error("Hospital Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


// =====================================
// Get Logged-in Hospital Profile
// =====================================
const getHospitalProfile = async (req, res) => {
  try {
    const hospital = await Hospital.findById(
      req.user.id
    ).select("-password");

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    return res.status(200).json({
      success: true,
      hospital,
    });
  } catch (error) {
    console.error(
      "Get Hospital Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


// =====================================
// Update Hospital Profile
// =====================================
const updateHospitalProfile = async (req, res) => {
  try {
    const {
      hospitalName,
      phone,
      address,
      latitude,
      longitude,
    } = req.body;

    const hospital = await Hospital.findById(
      req.user.id
    );

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    // Update only provided values
    if (hospitalName !== undefined) {
      hospital.hospitalName = hospitalName;
    }

    if (phone !== undefined) {
      hospital.phone = phone;
    }

    if (address !== undefined) {
      hospital.address = address;
    }

    if (latitude !== undefined) {
      hospital.latitude = Number(latitude);
    }

    if (longitude !== undefined) {
      hospital.longitude = Number(longitude);
    }

    const updatedHospital = await hospital.save();

    return res.status(200).json({
      success: true,
      message: "Hospital profile updated successfully",
      hospital: {
        id: updatedHospital._id,
        hospitalName: updatedHospital.hospitalName,
        email: updatedHospital.email,
        phone: updatedHospital.phone,
        address: updatedHospital.address,
        latitude: updatedHospital.latitude,
        longitude: updatedHospital.longitude,
        isActive: updatedHospital.isActive,
      },
    });
  } catch (error) {
    console.error(
      "Update Hospital Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


// =====================================
// Get All Registered Hospitals
// =====================================
const getAllHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({
      isActive: true,
    })
      .select("-password")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      message: "Hospitals fetched successfully",
      count: hospitals.length,
      hospitals,
    });
  } catch (error) {
    console.error(
      "Get All Hospitals Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


// =====================================
// EXPORT
// =====================================
module.exports = {
  loginHospital,
  getHospitalProfile,
  updateHospitalProfile,
  getAllHospitals,
};