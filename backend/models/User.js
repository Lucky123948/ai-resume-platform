const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  phone: String,
  otp: String,
  otpExpires: Date,
  isVerified: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", UserSchema);
