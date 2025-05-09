// models/TopRatedCourses.js

const mongoose = require("mongoose");

const trendingCourseSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    trendingScore: {
      type: Number,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    valid_from: { type: Date },
    valid_to: { type: Date },
    flag: { type: String, enum: ["active", "inactive"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrendingCourses", trendingCourseSchema);
