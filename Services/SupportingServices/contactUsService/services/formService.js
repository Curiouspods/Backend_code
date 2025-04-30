const EncryptionConfig = require('../config/encryptionConfig');
const UserForm = require('../models/userForm');

class formService {
    async submitForm(data) {
        try {
            if (!data) {
                throw new Error('Form data is missing');
            }

            // Encrypt email and phone number
            if (data.email) data.email = EncryptionConfig.encrypt(data.email);
            if (data.phone_number) data.phone_number = EncryptionConfig.encrypt(data.phone_number);

            // Save the form data
            const userForm = new UserForm({
                last_name: data.last_name,
                email: data.email,
                phone_number: data.phone_number,
                formType: data.formType,
                MSG_CONTACTUS_ACTIVE: data.MSG_CONTACTUS_ACTIVE || null,
                MSG_CONTACTUS_VISITOR: data.MSG_CONTACTUS_VISITOR || null,
                MSG_CONSULT: data.MSG_CONSULT || null,
                MSG_LICENSE: data.MSG_LICENSE || null,
                MSG_SUBSCRIBE: data.MSG_SUBSCRIBE || null,
                MSG_ENTERPRISE_ACTIVE: data.MSG_ENTERPRISE_ACTIVE || null,
                MSG_ENTERPRISE_VISITOR: data.MSG_ENTERPRISE_VISITOR || null,
                MSG_PAY_PER_CODE_ACIVE:data.MSG_PAY_PER_CODE_ACTIVE || null,
                MSG_PAY_PER_CODE_INACTIVE:data.MSG_PAY_PER_CODE_INACTIVE || null,
                MSG_CONSULT:data.MSG_CONSULT || null,
                created_at: new Date()
            });
            

            return await userForm.save();
        } catch (error) {
            throw new Error(`Error submitting form: ${error.message}`);
        }
    }
}

module.exports = new formService();
