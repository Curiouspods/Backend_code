// models/LatestCourse.js

const mongoose = require('mongoose');

const latestCourseSchema = new mongoose.Schema({
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
  link: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model('LatestCourses', latestCourseSchema);
