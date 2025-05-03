const mongoose = require('mongoose');

// Login history sub-schema
const loginHistorySchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  ip: String,
  device: String
}, { _id: false });

// OTP sub-schema
const otpSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  otpResendCount: { type: Number, default: 0 },
  otpResendTimestamp: { type: Date }
}, { _id: false });

// Main user schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  emailHash: { type: String, required: true, index: true },
  email_verified: { type: Boolean, default: false },

  password: { type: String },

  firstName: { type: String, required: true },
  lastName: { type: String },
  dateOfBirth: { type: Date, required: true }, // unified DoB

  phone_number: { type: String },
  phoneHash: { type: String, index: true },

  address: {
    state: String,
    country: String // ISO 3166-1 Alpha-2
  },

  twitter_id: { type: String, unique: true, sparse: true },
  linkedin_id: { type: String, unique: true, sparse: true },
  github_id: { type: String, unique: true, sparse: true },

  provider: { type: String, enum: ['local', 'twitter', 'linkedin', 'github', 'google'], default: 'local' },
  providerId: { type: String },

  industry: { type: String, required: true },

  status: { type: String, enum: ['active', 'inactive', 'banned'], default: 'inactive' },

  otp: {
    type: otpSchema,
    index: { expiresAt: 1 }
  },

  preferences: {
    notification_opt_in: { type: Boolean, default: false }
  },

  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  last_activity: { type: Date },
  login_history: [loginHistorySchema],

  birthdayEmailSent: {
    type: Map,
    of: Boolean,
    default: {}
  }

}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// === Methods ===

// Check if user is inactive (no login in last 30 days)
userSchema.methods.isInactive = function () {
  if (!this.lastLogin) return true;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return this.lastLogin < thirtyDaysAgo;
};

// Check if today is the user's birthday
userSchema.methods.isBirthday = function () {
  const today = new Date();
  const dob = new Date(this.dateOfBirth);

  return today.getMonth() === dob.getMonth() &&
         today.getDate() === dob.getDate();
};

// Check if birthday email already sent this year
userSchema.methods.birthdayEmailAlreadySent = function () {
  const currentYear = new Date().getFullYear().toString();
  return this.birthdayEmailSent && this.birthdayEmailSent.get(currentYear) === true;
};

// Mark birthday email as sent
userSchema.methods.markBirthdayEmailSent = function () {
  const currentYear = new Date().getFullYear().toString();
  this.birthdayEmailSent.set(currentYear, true);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
