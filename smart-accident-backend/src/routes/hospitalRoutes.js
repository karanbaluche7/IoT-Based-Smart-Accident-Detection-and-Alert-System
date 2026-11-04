const express = require("express");

const router = express.Router();

const {
  loginHospital,
  getHospitalProfile,
  updateHospitalProfile,
  getAllHospitals,
} = require("../controllers/hospitalController");

const { protect } = require("../middleware/authMiddleware");

// =====================================
// Hospital Login
// =====================================
router.post("/login", loginHospital);

// =====================================
// Get All Registered Hospitals
// =====================================
router.get("/", protect, getAllHospitals);

// =====================================
// Get Logged-in Hospital Profile
// =====================================
router.get("/profile", protect, getHospitalProfile);

// =====================================
// Update Hospital Profile
// =====================================
router.put("/profile", protect, updateHospitalProfile);

module.exports = router;