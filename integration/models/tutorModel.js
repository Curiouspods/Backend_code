const mongoose = require('mongoose');

const tutorialSchema = new mongoose.Schema({
  ProductID: { type: String, required: true },
  CourseID: { type: Number, unique: true, required: true },
  CourseTitle: { type: String, required: true },
  PlanID: { type: String, required: true },
  CourseStatus: { type: String, required: true },
  CourseVersion: { type: String, required: true }
});

const Tutorial = mongoose.model('VTEX_MGO_INTEG001', tutorialSchema);
module.exports = Tutorial;
