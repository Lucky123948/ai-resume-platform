const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    console.log("✅ Using existing MongoDB connection");
    return;
  }

  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai_resume";
    const db = await mongoose.connect(mongoUri);
    isConnected = db.connections[0].readyState;
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    // Removed process.exit(1) to prevent Vercel 502 Bad Gateway crashes
  }
}

module.exports = connectDB;
