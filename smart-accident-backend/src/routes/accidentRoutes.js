
const express = require("express");

const router = express.Router();

const {
  reportAccident,
  getAllAccidents,
  getAccidentById,
  updateAccidentStatus,
  deleteAccident,
  sendToNearbyHospital,
} = require("../controllers/accidentController");

const { protect } = require("../middleware/authMiddleware");

// ======================================
// ESP32 REPORTS AN ACCIDENT
// POST /api/accidents
// No hospital login required for the device
// ======================================

router.post("/", reportAccident);

// ======================================
// GET ALL ACCIDENTS FOR LOGGED-IN HOSPITAL
// GET /api/accidents
// ======================================

router.get("/", protect, getAllAccidents);

// ======================================
// FORWARD ACCIDENT TO NEARBY HOSPITAL
// PUT /api/accidents/:id/send-nearby-hospital
// ======================================

router.put(
  "/:id/send-nearby-hospital",
  protect,
  sendToNearbyHospital
);

// ======================================
// GET A SINGLE ACCIDENT
// GET /api/accidents/:id
// ======================================

router.get("/:id", protect, getAccidentById);

// ======================================
// UPDATE ACCIDENT STATUS
// PUT /api/accidents/:id
// ======================================

router.put("/:id", protect, updateAccidentStatus);

// ======================================
// DELETE ACCIDENT
// DELETE /api/accidents/:id
// ======================================

router.delete("/:id", protect, deleteAccident);

module.exports = router;