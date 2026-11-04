const express = require("express");

const router = express.Router();

const {
  registerHospital,
  loginHospital,
} = require("../controllers/authController");

// Register Hospital
router.post("/register", registerHospital);

// Login Hospital
router.post("/login", loginHospital);

module.exports = router;