const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  OBJECT_ID: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  USER_ID: {
    type: [String],
    required: true
  },
  USER_STATUS: {
    type: String,
    enum: ['ACTIVE', 'VISITOR', 'SUBSCRIBED'],
    required: false
  },
  CATEGORY_ID: {
    type: String,
    enum: ['PER', 'HOLY', 'PROD', 'TOP'],
    required: true
  },
  PLAN: {
    type: String,
    enum: ['EMSTECH', 'HEALTHCHAT', 'PPC', 'FLEXPICK','DEFAULT'],
    required: false
  },
  SUB_TYPE: {
    type: String,
    enum: ['MOTHSUB', 'ANNSUB', 'PPCTIME', 'FLEXPICK'],
    required: false
  },
  DISCOUNT: {
    type: mongoose.Schema.Types.Mixed, // Can be percentage or fixed amount
    required: true
  },
  EFF_START: {
    type: Date,
    required: true
  },
  EFF_END: {
    type: Date,
    required: true
  },
  MAX_USAGE: {
    type: Number,
    min: 0,
    max: 4,
    default: 1
  },
  TOP_CUST: {
    type: Boolean,
    default: false
  },
  user_rank:{
    type: Number,
    default:0
  },
  DISC_FLAG: {
    type: String,
    enum: ['APPL', 'NONAPPL'],
    required: true
  },
  CAT_DESCRP: {
    type: String,
    maxlength: 50
  },
  MESSAGE: {
    type: String,
    maxlength: 2000
  },
  // Track the actual usage
  CURRENT_USAGE: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Discount', discountSchema);