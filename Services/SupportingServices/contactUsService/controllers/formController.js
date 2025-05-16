const axios = require('axios');
const https = require('https');
const dotenv = require('dotenv');
const UserForm = require('../models/userForm');
const Registration = require('../models/user');
const { encryptData, decryptData } = require('../config/encryptionConfig');
const { sendEmail } = require('../services/emailService');

dotenv.config();

// 1. Map URL path to form type
const formTypeMapping = {
    "enterprise/active": "ENT_ACT",
    "enterprise/visitor": "VIS_ENT",
    "contactus/active": "ACT_CON",
    "contactus/visitor": "VIS_CON",
    "contactus/emergingtech": "CON_ETECH",
    "contactus/healthtech": "CON_HTECH",
    "contactus/flexpick": "CON_FPICK",
    "contactus/general": "CON_GENERAL",
    "consult": "CONSULT",
    "license": "LICENSE",
    "subscribe": "SUBSCRIBE",
    "paypercode/active": "PPC_ACTIVE",
    "paypercode/inactive": "PPC_INACTIVE"
};

// 2. Map formType to destination email
const formTypeToEmail = {
    "SUBSCRIBE": "Sales@vtex.ai",
    "CONSULT": "Sales@vtex.ai",
    "ENT_ACT": "Sales@vtex.ai",
    "ENTRSUB": "Sales@vtex.ai",
    "PPC_ACTIVE": "Sales@vtex.ai",
    "LICENSE": "Sales@vtex.ai",
    "ACT_CON": "Sales@vtex.ai",
    "VIS_CON": "Sales@vtex.ai",
    "VIS_ENT": "Sales@vtex.ai",
    "CON_ETECH": "Support@vtex.ai",
    "CON_HTECH": "Support@vtex.ai",
    "CON_FPICK": "Support@vtex.ai",
    "CON_GENERAL": "Support@vtex.ai"
};

exports.submitForm = async (req, res) => {
    try {
        // 1. reCAPTCHA verification
        const recaptchaToken = req.body['g-recaptcha-response'];
        if (!recaptchaToken) {
            return res.status(400).json({ message: "reCAPTCHA token is missing." });
        }

        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;

        const { data: recaptchaRes } = await axios.post(
            verificationUrl,
            {},
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Optional, if you get SSL issues
            }
        );

        if (!recaptchaRes.success) {
            return res.status(400).json({ message: "Failed reCAPTCHA verification." });
        }

        // 2. Form logic
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
        await sendEmail(email, supportEmail, `New Form Submission: ${mappedFormType}`,
            `Hello Support Team,\n\nA new form has been submitted.\n\nForm Type: ${mappedFormType}\nUser Email: ${decryptData(formData.email)}\nUser Message: ${message}\n\nBest Regards,\nYour System`
        );
        res.status(201).json({
            message: `${mappedFormType} form submitted successfully`,
            data: savedForm
        });
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
