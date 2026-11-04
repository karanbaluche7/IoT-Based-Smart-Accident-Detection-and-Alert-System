const jwt = require("jsonwebtoken");

module.exports = function providerAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (
      decoded.role !== "device-admin" ||
      !decoded.providerId
    ) {
      return res.status(403).json({
        success: false,
        message: "Device administrator access required",
      });
    }

    req.providerId = decoded.providerId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};