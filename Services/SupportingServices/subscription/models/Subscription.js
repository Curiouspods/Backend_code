const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  UserID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    index: true
  },
  Sub_status: {
    type: String,
    required: true
  },
  plan_id: {
    type: String,
    required: true,
    enum: ['Emerging tech', 'HealthTech AI', 'PPC', 'FlexPicks']
  },
  Solution_id: {
    type: String,
    maxlength: 1000
  },
  auto_renew: {
    type: Boolean,
    default: false
  },
  VALID_Month: {
    type: Date,
    required: true
  },
  CODE_PERMIT: {
    type: Boolean,
    default: false
  },
  CODE_STATUS: {
    type: String,
    enum: ['CURRENT', 'PAST', 'FUTURE'],
    required: true
  },
  start_date: {
    type: String,
    required: true
  },
  End_Date: {
    type: String,
    default: '31/12/9999'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;