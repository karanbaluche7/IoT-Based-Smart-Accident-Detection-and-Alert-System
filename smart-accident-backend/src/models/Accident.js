
const mongoose = require("mongoose");

const accidentSchema = new mongoose.Schema(
  {
    // DEVICE INFORMATION
    deviceId: {
      type: String,
      required: true,
      trim: true,
    },

    // VEHICLE INFORMATION
    vehicleNumber: {
      type: String,
      default: "Not Available",
      trim: true,
    },

    // PERSON INFORMATION
    personName: {
      type: String,
      default: "Not Available",
      trim: true,
    },

    dateOfBirth: {
      type: String,
      default: "Not Available",
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Not Available"],
      default: "Not Available",
    },

    bloodGroup: {
      type: String,
      default: "Not Available",
      trim: true,
    },

    phoneNumber: {
      type: String,
      default: "Not Available",
      trim: true,
    },

    parentPhoneNumber: {
      type: String,
      default: "Not Available",
      trim: true,
    },

    personAddress: {
      type: String,
      default: "Not Available",
      trim: true,
    },

    // ACCIDENT LOCATION
    address: {
      type: String,
      default: "Address not available",
      trim: true,
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    // ACCIDENT INFORMATION
    severity: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    accidentType: {
      type: String,
      default: "Unknown",
      trim: true,
    },

    // SENSOR DATA
    accelerometerX: {
      type: Number,
      default: 0,
    },

    accelerometerY: {
      type: Number,
      default: 0,
    },

    accelerometerZ: {
      type: Number,
      default: 0,
    },

    accelerationDelta: {
      type: Number,
      default: 0,
    },

    vibrationDetected: {
      type: Boolean,
      default: false,
    },

    // NEW: OPTIONAL, VERIFIED DETECTION ACCURACY
    // Percentage from 0 to 100.
    // Null means accuracy has not been measured.
    detectionAccuracy: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    // NEW: PUSH-BUTTON PRESS COUNT
    pushButtonPressCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ACCIDENT STATUS
    status: {
      type: String,
      enum: ["Active", "Accepted", "Resolved"],
      default: "Active",
    },

    // ASSIGNED HOSPITAL
    assignedHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      default: null,
    },

    distance: {
      type: Number,
      default: 0,
    },

    // NOTIFIED HOSPITALS
    notifiedHospitals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hospital",
      },
    ],

    // TIMESTAMP
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Accident",
  accidentSchema
);