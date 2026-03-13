const mongoose = require("mongoose");

const AnalysisSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true
  },
  predictedRole: {
    type: String,
    required: true
  },
  matchPercentage: {
    type: Number,
    required: true
  },
  missingSkills: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resumeFile: {
    data: Buffer,
    contentType: String,
    originalName: String
  }
});

module.exports = mongoose.model("Analysis", AnalysisSchema);
