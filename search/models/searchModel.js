const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({
  Title: { type: String, required: true },
  Plan: { type: String, required: true },
  CourseID: { type: String, unique: true, required: true },
  Tag: { type: String, required: true },
  Subtags: { type: [String], required: true },
});

const SearchData = mongoose.model('VTEX_MGO_SEARCH001', searchSchema);
module.exports = SearchData;
