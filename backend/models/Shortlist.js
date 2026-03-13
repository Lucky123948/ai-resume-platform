const mongoose = require("../db");

const ShortlistSchema = new mongoose.Schema({
  candidateName: String,
  percentage: Number,
  shortlistedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Shortlist", ShortlistSchema);
