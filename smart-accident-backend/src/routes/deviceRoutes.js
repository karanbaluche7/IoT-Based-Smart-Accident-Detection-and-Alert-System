
const express = require("express");
const mongoose = require("mongoose");
const Device = require("../models/Device");

const router = express.Router();

// GET /api/devices?deviceId=ESP32_001
// Search for a device or list all registered devices.
router.get("/", async (req, res) => {
  try {
    const { deviceId } = req.query;

    if (deviceId) {
      const device = await Device.findOne({
        deviceId: deviceId.trim(),
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Device not found.",
        });
      }

      return res.status(200).json({
        success: true,
        device,
      });
    }

    const devices = await Device.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      devices,
    });
  } catch (error) {
    console.error("Get devices error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve devices.",
    });
  }
});

// POST /api/devices
// Register a new device.
router.post("/", async (req, res) => {
  try {
    const {
      deviceId,
      vehicleNumber,
      personName,
      dateOfBirth,
      gender,
      bloodGroup,
      phoneNumber,
      parentPhoneNumber,
      personAddress,
    } = req.body || {};

    // Validate the required fields.
    if (
      typeof deviceId !== "string" ||
      !deviceId.trim() ||
      typeof vehicleNumber !== "string" ||
      !vehicleNumber.trim() ||
      typeof personName !== "string" ||
      !personName.trim() ||
      typeof phoneNumber !== "string" ||
      !phoneNumber.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Device ID, vehicle number, owner name and owner phone are required.",
      });
    }

    const cleanDeviceId = deviceId.trim();
    const cleanVehicleNumber = vehicleNumber.trim();
    const cleanPersonName = personName.trim();
    const cleanPhoneNumber = phoneNumber.trim();

    // Check for an existing device ID.
    const existing = await Device.findOne({
      deviceId: cleanDeviceId,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This device ID is already registered.",
      });
    }

    // Create and save the device in MongoDB.
    const device = await Device.create({
      deviceId: cleanDeviceId,
      vehicleNumber: cleanVehicleNumber,
      personName: cleanPersonName,
      dateOfBirth: dateOfBirth || "Not Available",
      gender: gender || "Not Available",
      bloodGroup: bloodGroup || "Not Available",
      phoneNumber: cleanPhoneNumber,
      parentPhoneNumber:
        parentPhoneNumber?.trim() || "Not Available",
      personAddress: personAddress?.trim() || "Not Available",
    });

    return res.status(201).json({
      success: true,
      message: "Device registered successfully.",
      device,
    });
  } catch (error) {
    console.error("Register device error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This device ID is already registered.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to register device.",
    });
  }
});

// PUT /api/devices/:id
// Update vehicle and owner information.
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid device record ID.",
      });
    }

    const allowedFields = [
      "vehicleNumber",
      "personName",
      "dateOfBirth",
      "gender",
      "bloodGroup",
      "phoneNumber",
      "parentPhoneNumber",
      "personAddress",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] =
          typeof req.body[field] === "string"
            ? req.body[field].trim()
            : req.body[field];
      }
    }

    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Device details updated successfully.",
      device,
    });
  } catch (error) {
    console.error("Update device error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update device.",
    });
  }
});

module.exports = router;