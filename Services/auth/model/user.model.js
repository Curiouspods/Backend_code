const mongoose = require('mongoose');

// Schema for login history
const loginHistorySchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  ip: {
    type: String
  },
  device: {
    type: String
  }
}, { _id: false });

// Schema for OTP
const otpSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  otpResendCount: {
    type: Number,
    default: 0
  },
  otpResendTimestamp: {
    type: Date
  }
}, { _id: false });

// Main User Schema
const userSchema = new mongoose.Schema({
  twitter_id: { type: String, unique: true, sparse: true },
  linkedin_id: { type: String, unique: true, sparse: true },
  github_id: { type: String, unique: true, sparse: true },

  provider: { type: String, enum: ['local', 'google', 'linkedin', 'twitter', 'github'], default: 'local' },
  providerId: { type: String },

  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  DoB: { type: Date },

  industry: { type: String, required: true },

  email: { type: String, required: true, unique: true },
  emailHash: { type: String, required: true, index: true },

  password: { type: String },

  phone_number: { type: String },
  phoneHash: { type: String, index: true },

  address: {
    state: { type: String, required: true },
    country: { type: String, required: true } // ISO 3166-1 Alpha-2
  },

  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'inactive'
  },

  email_verified: { type: Boolean, default: false },

  otp: {
    type: otpSchema,
    index: { expiresAt: 1 }
  },

  preferences: {
    notification_opt_in: { type: Boolean, default: false }
  },

  last_login: { type: Date },
  last_activity: { type: Date },
  login_history: [loginHistorySchema],

  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  passwordChangedAt: { type: Date }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Instance method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
