
const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    personName: {
      type: String,
      required: true,
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

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Device", deviceSchema);