const mongoose = require('mongoose');

const userFormSchema = new mongoose.Schema({
    last_name: String,
    email: String,
    phone_number: String,
    formType: String,
    MSG_CONTACTUS_ACTIVE: String,
    MSG_CONTACTUS_VISITOR: String,
    MSG_CONSULT: String,
    MSG_LICENSE: String,
    MSG_SUBSCRIBE: String,
    MSG_ENTERPRISE_VISITOR: String,
    MSG_ENTERPRISE_ACTIVE: String,
    isCancelled: { type: Boolean, default: false },
    cancelReason: { type: String, default: null },
    cancelledAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('UserForm', userFormSchema);
