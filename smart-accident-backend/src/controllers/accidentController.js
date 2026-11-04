
const Accident = require("../models/Accident");
const Hospital = require("../models/Hospital");
const Device = require("../models/Device");
const { getDistance } = require("geolib");

// ======================================
// GET ACCIDENT ADDRESS FROM GPS
// ======================================
const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const url =
      "https://nominatim.openstreetmap.org/reverse" +
      `?format=json&lat=${latitude}&lon=${longitude}` +
      "&zoom=18&addressdetails=1";

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Smart-Accident-Detection-Student-Project/1.0",
      },
    });

    if (!response.ok) {
      return "Address not available";
    }

    const data = await response.json();
    return data.display_name || "Address not available";
  } catch (error) {
    console.error("Reverse Geocoding Error:", error.message);
    return "Address not available";
  }
};

// ======================================
// GET REGISTERED DEVICE INFORMATION
// ======================================
const getDeviceInformation = async (deviceId) => {
  const normalizedDeviceId = String(deviceId || "").trim();

  if (!normalizedDeviceId) {
    return null;
  }

  let device = await Device.findOne({
    deviceId: normalizedDeviceId,
  });

  // Try a case-insensitive match if an exact match fails.
  if (!device) {
    const escapedDeviceId = normalizedDeviceId.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    device = await Device.findOne({
      deviceId: {
        $regex: `^${escapedDeviceId}$`,
        $options: "i",
      },
    });
  }

  console.log(
    `[Device Lookup] ${normalizedDeviceId}:`,
    device ? "FOUND" : "NOT FOUND"
  );

  if (!device) {
    return null;
  }

  return {
    vehicleNumber: device.vehicleNumber || "Not Available",
    personName: device.personName || "Not Available",
    dateOfBirth: device.dateOfBirth || "Not Available",
    gender: device.gender || "Not Available",
    bloodGroup: device.bloodGroup || "Not Available",
    phoneNumber: device.phoneNumber || "Not Available",
    parentPhoneNumber: device.parentPhoneNumber || "Not Available",
    personAddress: device.personAddress || "Not Available",
  };
};

// ======================================
// REPORT ACCIDENT
// ESP32 -> BACKEND -> MONGODB
// ======================================
const reportAccident = async (req, res) => {
  try {
    const {
      deviceId,
      latitude,
      longitude,
      severity,
      accidentType,
      accelerometerX,
      accelerometerY,
      accelerometerZ,
      accelerationDelta,
      vibrationDetected,
      detectionAccuracy,
      pushButtonPressCount,
    } = req.body;

    // Validate required data.
    const normalizedDeviceId = String(deviceId || "").trim();
    const lat = Number(latitude);
    const lon = Number(longitude);

    if (
      !normalizedDeviceId ||
      latitude === undefined ||
      latitude === null ||
      longitude === undefined ||
      longitude === null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid device ID, latitude and longitude are required.",
      });
    }

    // Look up registered device.
    const deviceInfo = await getDeviceInformation(normalizedDeviceId);
    const registeredDeviceFound = Boolean(deviceInfo);

    if (!registeredDeviceFound) {
      console.warn(
        `No registered device found for ID: ${normalizedDeviceId}`
      );
    }

    const personInfo = deviceInfo || {
      vehicleNumber: "Not Available",
      personName: "Not Available",
      dateOfBirth: "Not Available",
      gender: "Not Available",
      bloodGroup: "Not Available",
      phoneNumber: "Not Available",
      parentPhoneNumber: "Not Available",
      personAddress: "Not Available",
    };

    // Get address from GPS.
    const accidentAddress = await getAddressFromCoordinates(lat, lon);

    // Find active hospitals.
    const hospitals = await Hospital.find({ isActive: true });

    let assignedHospital = null;
    let minDistance = Infinity;

    // Find the nearest active hospital with valid coordinates.
    hospitals.forEach((hospital) => {
      if (
        hospital.latitude == null ||
        hospital.longitude == null ||
        !Number.isFinite(Number(hospital.latitude)) ||
        !Number.isFinite(Number(hospital.longitude))
      ) {
        return;
      }

      const distance = getDistance(
        { latitude: lat, longitude: lon },
        {
          latitude: Number(hospital.latitude),
          longitude: Number(hospital.longitude),
        }
      );

      if (distance < minDistance) {
        minDistance = distance;
        assignedHospital = hospital;
      }
    });

    // Normalize numeric sensor values.
    const toFiniteNumber = (value, fallback = 0) => {
      if (value === undefined || value === null || value === "") {
        return fallback;
      }

      const number = Number(value);
      return Number.isFinite(number) ? number : fallback;
    };

    // Accuracy is optional. Do not invent a value when it is missing.
    const accuracyValue = toFiniteNumber(detectionAccuracy, null);
    const validDetectionAccuracy =
      accuracyValue !== null &&
      accuracyValue >= 0 &&
      accuracyValue <= 100
        ? accuracyValue
        : null;

    const buttonCount = toFiniteNumber(pushButtonPressCount, 0);
    const validPushButtonPressCount =
      Number.isInteger(buttonCount) && buttonCount >= 0
        ? buttonCount
        : 0;

    // Create accident record.
    const accident = await Accident.create({
      // Device information
      deviceId: normalizedDeviceId,

      // Registered vehicle and person information
      vehicleNumber: personInfo.vehicleNumber,
      personName: personInfo.personName,
      dateOfBirth: personInfo.dateOfBirth,
      gender: personInfo.gender,
      bloodGroup: personInfo.bloodGroup,
      phoneNumber: personInfo.phoneNumber,
      parentPhoneNumber: personInfo.parentPhoneNumber,
      personAddress: personInfo.personAddress,

      // Accident location
      latitude: lat,
      longitude: lon,
      address: accidentAddress,

      // Accident information
      severity: severity || "Medium",
      accidentType: accidentType || "Unknown",

      // Sensor information
      accelerometerX: toFiniteNumber(accelerometerX),
      accelerometerY: toFiniteNumber(accelerometerY),
      accelerometerZ: toFiniteNumber(accelerometerZ),
      accelerationDelta: toFiniteNumber(accelerationDelta),

      vibrationDetected:
        vibrationDetected === true ||
        vibrationDetected === "true" ||
        vibrationDetected === 1 ||
        vibrationDetected === "1",

      // Detection metrics
      detectionAccuracy: validDetectionAccuracy,
      pushButtonPressCount: validPushButtonPressCount,

      // Accident status
      status: "Active",
      timestamp: new Date(),

      // Hospital assignment
      assignedHospital: assignedHospital ? assignedHospital._id : null,

      // Distance in kilometres
      distance: assignedHospital
        ? Number((minDistance / 1000).toFixed(2))
        : 0,
    });

    // Real-time notification to the assigned hospital.
    const io = req.app.get("io");

    if (io && assignedHospital) {
      io.to(`hospital:${assignedHospital._id}`).emit(
        "accident:new",
        accident
      );
    }

    return res.status(201).json({
      success: true,
      message: "Accident reported successfully.",
      registeredDeviceFound,
      assignedHospital: assignedHospital
        ? {
            id: assignedHospital._id,
            hospitalName: assignedHospital.hospitalName,
            phone: assignedHospital.phone,
            address: assignedHospital.address,
            latitude: assignedHospital.latitude,
            longitude: assignedHospital.longitude,
            distance: Number((minDistance / 1000).toFixed(2)),
          }
        : null,
      accident,
    });
  } catch (error) {
    console.error("Report Accident Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ======================================
// GET ALL ACCIDENTS FOR HOSPITAL
// ======================================
const getAllAccidents = async (req, res) => {
  try {
    const hospitalId = req.user._id;

    const accidents = await Accident.find({
      assignedHospital: hospitalId,
    })
      .populate(
        "assignedHospital",
        "hospitalName phone address latitude longitude"
      )
      .sort({ timestamp: -1 });

    return res.status(200).json({
      success: true,
      total: accidents.length,
      accidents,
    });
  } catch (error) {
    console.error("Get Hospital Accidents Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ======================================
// GET ACCIDENT BY ID
// ======================================
const getAccidentById = async (req, res) => {
  try {
    const accident = await Accident.findById(req.params.id).populate(
      "assignedHospital",
      "hospitalName phone address latitude longitude"
    );

    if (!accident) {
      return res.status(404).json({
        success: false,
        message: "Accident not found.",
      });
    }

    // Check hospital authorization.
    if (
      accident.assignedHospital &&
      accident.assignedHospital._id.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this accident.",
      });
    }

    // Refresh registered details for older accident records.
    const deviceInfo = await getDeviceInformation(accident.deviceId);

    if (deviceInfo) {
      accident.vehicleNumber = deviceInfo.vehicleNumber;
      accident.personName = deviceInfo.personName;
      accident.dateOfBirth = deviceInfo.dateOfBirth;
      accident.gender = deviceInfo.gender;
      accident.bloodGroup = deviceInfo.bloodGroup;
      accident.phoneNumber = deviceInfo.phoneNumber;
      accident.parentPhoneNumber = deviceInfo.parentPhoneNumber;
      accident.personAddress = deviceInfo.personAddress;

      await accident.save();
    }

    return res.status(200).json({
      success: true,
      accident,
    });
  } catch (error) {
    console.error("Get Accident By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ======================================
// UPDATE ACCIDENT STATUS
// ======================================
const updateAccidentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["Active", "Accepted", "Resolved"];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Use Active, Accepted or Resolved.",
      });
    }

    const accident = await Accident.findById(req.params.id);

    if (!accident) {
      return res.status(404).json({
        success: false,
        message: "Accident not found.",
      });
    }

    if (
      accident.assignedHospital &&
      accident.assignedHospital.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to update this accident.",
      });
    }

    accident.status = status || accident.status;
    await accident.save();

    const io = req.app.get("io");

    if (io && accident.assignedHospital) {
      io.to(`hospital:${accident.assignedHospital}`).emit(
        "accident:updated",
        accident
      );
    }

    return res.status(200).json({
      success: true,
      message: "Accident status updated.",
      accident,
    });
  } catch (error) {
    console.error("Update Accident Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ======================================
// DELETE ACCIDENT
// ======================================
const deleteAccident = async (req, res) => {
  try {
    const accident = await Accident.findById(req.params.id);

    if (!accident) {
      return res.status(404).json({
        success: false,
        message: "Accident not found.",
      });
    }

    if (
      accident.assignedHospital &&
      accident.assignedHospital.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this accident.",
      });
    }

    await accident.deleteOne();

    const io = req.app.get("io");

    if (io && accident.assignedHospital) {
      io.to(`hospital:${accident.assignedHospital}`).emit(
        "accident:deleted",
        { accidentId: req.params.id }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Accident deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Accident Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ======================================
// FORWARD ACCIDENT TO NEARBY HOSPITAL
// ======================================
const sendToNearbyHospital = async (req, res) => {
  try {
    const { id } = req.params;
    const accident = await Accident.findById(id);

    if (!accident) {
      return res.status(404).json({
        success: false,
        message: "Accident not found.",
      });
    }

    if (
      !accident.assignedHospital ||
      accident.assignedHospital.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to forward this accident.",
      });
    }

    if (
      accident.latitude == null ||
      accident.longitude == null
    ) {
      return res.status(400).json({
        success: false,
        message: "Accident location is not available.",
      });
    }

    const currentHospitalId = accident.assignedHospital.toString();

    const hospitals = await Hospital.find({
      isActive: true,
      latitude: { $exists: true },
      longitude: { $exists: true },
    });

    let nearestHospital = null;
    let nearestDistance = Infinity;

    hospitals.forEach((hospital) => {
      if (hospital._id.toString() === currentHospitalId) {
        return;
      }

      if (
        hospital.latitude == null ||
        hospital.longitude == null ||
        !Number.isFinite(Number(hospital.latitude)) ||
        !Number.isFinite(Number(hospital.longitude))
      ) {
        return;
      }

      const distance = getDistance(
        {
          latitude: Number(accident.latitude),
          longitude: Number(accident.longitude),
        },
        {
          latitude: Number(hospital.latitude),
          longitude: Number(hospital.longitude),
        }
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestHospital = hospital;
      }
    });

    if (!nearestHospital) {
      return res.status(404).json({
        success: false,
        message: "No other active hospital was found nearby.",
      });
    }

    const distanceKm = Number((nearestDistance / 1000).toFixed(2));
    const previousHospitalId = accident.assignedHospital;

    accident.assignedHospital = nearestHospital._id;
    accident.distance = distanceKm;
    accident.status = "Active";

    await accident.save();

    const io = req.app.get("io");

    if (io) {
      io.to(`hospital:${previousHospitalId}`).emit(
        "accident:reassigned",
        {
          accidentId: accident._id,
          newHospitalId: nearestHospital._id,
        }
      );

      io.to(`hospital:${nearestHospital._id}`).emit(
        "nearby-hospital-alert",
        {
          accident,
          hospital: {
            id: nearestHospital._id,
            hospitalName: nearestHospital.hospitalName,
            phone: nearestHospital.phone,
            address: nearestHospital.address,
            latitude: nearestHospital.latitude,
            longitude: nearestHospital.longitude,
            distance: distanceKm,
          },
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: `Accident forwarded to ${nearestHospital.hospitalName}.`,
      hospital: {
        id: nearestHospital._id,
        hospitalName: nearestHospital.hospitalName,
        phone: nearestHospital.phone,
        address: nearestHospital.address,
        latitude: nearestHospital.latitude,
        longitude: nearestHospital.longitude,
        distance: distanceKm,
      },
      accident,
    });
  } catch (error) {
    console.error("Send Nearby Hospital Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send accident to nearby hospital.",
      error: error.message,
    });
  }
};

// ======================================
// EXPORT CONTROLLERS
// ======================================
module.exports = {
  reportAccident,
  getAllAccidents,
  getAccidentById,
  updateAccidentStatus,
  deleteAccident,
  sendToNearbyHospital,
};