const jwt = require("jsonwebtoken");

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

module.exports = function (req, res, next) {
  const tokenHeader = req.header("Authorization");

  if (!tokenHeader) {
    return res.status(401).json({ message: "No token, access denied" });
  }

  try {
    // Check if token has "Bearer " prefix and remove it
    const token = tokenHeader.startsWith("Bearer ")
      ? tokenHeader.slice(7, tokenHeader.length)
      : tokenHeader;

    console.log("🔍 Auth Middleware: Verifying token...");

    const verified = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    console.log("✅ Decoded Token Payload:", verified); // DEBUG: Print full payload

    req.user = verified;
    next();
  } catch (err) {
    console.error("❌ Auth Middleware Error:", err.message);
    res.status(400).json({ message: "Invalid token" });
  }
};