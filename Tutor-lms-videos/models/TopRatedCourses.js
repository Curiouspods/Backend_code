// models/TopRatedCourses.js

const mongoose = require("mongoose");

const topRatedCourseSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: true,
    },
    reviews: {
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

module.exports = mongoose.model("TopRatedCourses", topRatedCourseSchema);
