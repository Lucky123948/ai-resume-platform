const mongoose = require("mongoose");

async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai_resume";
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  }
}

module.exports = connectDB;
