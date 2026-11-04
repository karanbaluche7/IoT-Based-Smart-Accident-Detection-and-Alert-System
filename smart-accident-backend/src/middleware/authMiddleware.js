const jwt = require("jsonwebtoken");
const Hospital = require("../models/Hospital");

const protect = async (req, res, next) => {
  let token;

  try {
    // Check Authorization Header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Get Token
      token = req.headers.authorization.split(" ")[1];

      // Verify Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get Hospital Details (Exclude Password)
      req.user = await Hospital.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Hospital not found.",
        });
      }

      next();
    } else {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }
  } catch (error) {
    console.error(error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

module.exports = {
  protect,
};