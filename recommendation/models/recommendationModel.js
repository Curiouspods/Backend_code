const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  Video: { type: String, required: true },
  CourseID: { type: String, unique: true, required: true },
  RecommendedVideos: { type: [String], required: true }
});

const Recommendation = mongoose.model('VTEX_MGO_RECOMM001', recommendationSchema);
module.exports = Recommendation;
