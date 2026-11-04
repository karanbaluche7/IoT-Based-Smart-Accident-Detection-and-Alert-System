
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");
const accidentRoutes = require("./routes/accidentRoutes");

// Device Administrator and device management routes
const providerRoutes = require("./routes/providerRoutes");
const deviceRoutes = require("./routes/deviceRoutes");

const {
  notFound,
  errorHandler,
} = require("./middleware/errorMiddleware");

const app = express();

// =====================================================
// PHONE GPS LOCATION STORAGE
// =====================================================

let latestLocation = {
  latitude: null,
  longitude: null,
  accuracy: null,
  updatedAt: null,
};

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());

// =====================================================
// HOME ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Accident Detection Backend Running",
  });
});

// =====================================================
// PHONE GPS PAGE
// =====================================================

app.get("/location", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "location.html")
  );
});

// =====================================================
// RECEIVE PHONE GPS LOCATION
// =====================================================

app.post("/api/location", (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;

    if (
      latitude === undefined ||
      longitude === undefined ||
      !Number.isFinite(Number(latitude)) ||
      !Number.isFinite(Number(longitude))
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    latestLocation = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy:
        accuracy !== undefined &&
        Number.isFinite(Number(accuracy))
          ? Number(accuracy)
          : null,
      updatedAt: new Date(),
    };

    console.log("=================================");
    console.log("PHONE LOCATION UPDATED");
    console.log("Latitude:", latestLocation.latitude);
    console.log("Longitude:", latestLocation.longitude);
    console.log("Accuracy:", latestLocation.accuracy);
    console.log("=================================");

    return res.status(200).json({
      success: true,
      message: "Location updated successfully",
      location: latestLocation,
    });
  } catch (error) {
    console.error("Location update error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update location",
    });
  }
});

// =====================================================
// GET LATEST PHONE GPS LOCATION
// =====================================================

app.get("/api/location", (req, res) => {
  try {
    if (
      latestLocation.latitude === null ||
      latestLocation.longitude === null
    ) {
      return res.status(404).json({
        success: false,
        message: "Phone location not available",
      });
    }

    return res.status(200).json({
      success: true,
      location: latestLocation,
    });
  } catch (error) {
    console.error("Get location error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get location",
    });
  }
});

// =====================================================
// EXISTING API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/accidents", accidentRoutes);

// =====================================================
// DEVICE ADMINISTRATOR API
// =====================================================

// POST /api/provider/register
// POST /api/provider/login

app.use("/api/provider", providerRoutes);

// =====================================================
// DEVICE MANAGEMENT API
// =====================================================

// GET    /api/devices
// POST   /api/devices
// DELETE /api/devices/:id

app.use("/api/devices", deviceRoutes);

// =====================================================
// ERROR MIDDLEWARE — KEEP AT THE END
// =====================================================

app.use(notFound);
app.use(errorHandler);

module.exports = app;