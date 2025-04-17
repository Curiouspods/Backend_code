const mongoose = require('mongoose');

const FlashMessageSchema = new mongoose.Schema({
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  validFrom: {
    type: Date,
    required: [true, 'Valid from date is required']
  },
  validTill: {
    type: Date,
    required: [true, 'Valid till date is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FlashMessage', FlashMessageSchema);