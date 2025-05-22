// models/cancelForm.js
const mongoose = require('mongoose');

const cancelFormSchema = new mongoose.Schema({
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
    feedback: {
        type: String,
        required: true
    },
    formType: {
        type: String,
        required: true,
        enum: ['CANCEL'],
        default: 'CANCEL'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

const CancelForm = mongoose.model('CancelForm', cancelFormSchema);

module.exports = CancelForm;