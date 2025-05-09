// models/LatestCourse.js

const mongoose = require("mongoose");

const latestCourseSchema = new mongoose.Schema(
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
    link: {
      type: String,
      required: true,
    },
    enrollment_count: {
      type: Number,
      required: true,
    },
    ratings: {
      type: Number,
    },
    valid_from: { type: Date },
    valid_to: { type: Date },
    flag: { type: String, enum: ["active", "inactive"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LatestCourses", latestCourseSchema);
