// models/TopRatedCourses.js

const mongoose = require('mongoose');

const trendingCourseSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  trendingScore: {
    type: Number,
    required: true
  },
  link: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('TrendingCourses', trendingCourseSchema);
