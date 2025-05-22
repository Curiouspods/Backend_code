// models/featureRequest.js
const mongoose = require('mongoose');

const featureRequestSchema = new mongoose.Schema({
    isActiveUser: {
        type: Boolean,
        required: true,
        default: true
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    requestDetails: {
        type: String,
        required: true
    },
    formType: {
        type: String,
        required: true,
        enum: ['FEATURE_REQUEST'],
        default: 'FEATURE_REQUEST'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

const FeatureRequest = mongoose.model('FeatureRequest', featureRequestSchema);

module.exports = FeatureRequest;