const UserForm = require('../models/userForm');
const Registration = require('../models/user');
const { encryptData, decryptData } = require('../config/encryptionConfig'); // Import encryption functions

const formTypeMapping = {
    "enterprise/active": "ENT_ACT",
    "enterprise/visitor": "VIS_ENT",
    "contactus/active": "ACT_CON",
    "contactus/visitor": "VIS_CON",
    "consult": "CONSULT",
    "license": "LICENSE",
    "subscribe": "SUBSCRIBE",
    "paypercode/active":"PPC_ACTIVE",
    "paypercode/inactive":"PPC_INACTIVE",
    "consult":"consult",
};

exports.submitForm = async (req, res) => {
    try {
        const { formType, subType } = req.params;
        const urlPath = subType ? `${formType}/${subType}` : formType;
        const mappedFormType = formTypeMapping[urlPath];

        if (!mappedFormType) {
            return res.status(400).json({ message: "Invalid form type or subType in URL." });
        }

        let { email, phone_number, userId, ...formData } = req.body;
        let userDetails = null;

        // Check if user exists in Registration DB
        if (userId) {
            userDetails = await Registration.findById(userId);
        } else if (email) {
            const encryptedEmail = encryptData(email);
            userDetails = await Registration.findOne({ email: encryptedEmail });
        }

        // If user exists, autofill form with decrypted values
        if (userDetails) {
            formData.first_name = userDetails.first_name;
            formData.last_name = userDetails.last_name;
            formData.email = decryptData(userDetails.email);
            formData.phone_number = decryptData(userDetails.phone_number);
        } else {
            // Encrypt email and phone before saving if user doesn't exist
            if (email) formData.email = encryptData(email);
            if (phone_number) formData.phone_number = encryptData(phone_number);
        }

        const newForm = new UserForm({ formType: mappedFormType, ...formData });
        const savedForm = await newForm.save();

        res.status(201).json({ message: `${mappedFormType} form submitted successfully`, data: savedForm });
    } catch (error) {
        res.status(400).json({ message: "Error submitting form", error: error.message });
    }
};

exports.getAllForms = async (req, res) => {
    try {
        const forms = await UserForm.find();

        // Decrypt email and phone_number before sending response
        const decryptedForms = forms.map(form => ({
            ...form._doc,
            email: form.email ? decryptData(form.email) : null,
            phone_number: form.phone_number ? decryptData(form.phone_number) : null
        }));

        res.status(200).json(decryptedForms);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving forms", error: error.message });
    }
};
exports.cancelForm = async (req, res) => {
    try {
        const { id } = req.params;
        const { cancelReason } = req.body;

        if (!cancelReason) {
            return res.status(400).json({ message: "Cancellation reason is required." });
        }

        const form = await UserForm.findById(id);
        if (!form) {
            return res.status(404).json({ message: "Form not found." });
        }

        if (form.isCancelled) {
            return res.status(400).json({ message: "This form has already been canceled." });
        }

        form.isCancelled = true;
        form.cancelReason = cancelReason;
        form.cancelledAt = new Date();
        await form.save();

        res.status(200).json({ message: "Form canceled successfully.", data: form });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};