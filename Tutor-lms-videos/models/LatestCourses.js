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
  link: {
    type: String,
    required: true
  },
  enrollment_count:{
    type:Number,
    required:true
  },
  ratings:{
    type:Number,
  }
}, { timestamps: true });

module.exports = mongoose.model('LatestCourses', latestCourseSchema);
