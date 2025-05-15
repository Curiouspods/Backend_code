const mongoose = require('mongoose');
const { archiveConnection } = require('../config/db');

const ArchivedUserSchema = new mongoose.Schema({
  originalId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  subscription: {
    plan: String,
    paymentMethod: String,
    expiresAt: Date
  },
  lastActiveAt: {
    type: Date
  },
  userData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  archivedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = archiveConnection.model('ArchivedUser', ArchivedUserSchema);