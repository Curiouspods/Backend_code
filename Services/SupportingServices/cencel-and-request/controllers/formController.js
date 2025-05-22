const axios = require('axios');
const CancelForm = require('../models/cancelForm');
const FeatureRequest=require('../models/featureRequest')
const {sendEmail}=require('../services/emailService')
// 1. Update the verifyCaptcha function in formController.js

const verifyCaptcha = async (captchaToken) => {
    const secretKey = process.env.CAPTCHA_SECRET_KEY;
    const captchaVerifyURL = `https://www.google.com/recaptcha/api/siteverify`;

    if (!captchaToken) {
        return false; // If token is missing, return false
    }

    const response = await axios.post(captchaVerifyURL, null, {
        params: {
            secret: secretKey,
            response: captchaToken
        }
    });
    console.log("CAPTCHA Verification Response:", response.data);
    return response.data.success;
};

// 2. Update the cancel form controller function
exports.submitCancelForm = async (req, res) => {
    try {
        const { userName, email, phoneNumber, feedback, captchaToken, formType } = req.body;

        if (!userName || !email || !phoneNumber || !feedback) {
            return res.status(400).json({ message: "All fields are required." });
        }

        if (!captchaToken) {
            return res.status(400).json({ message: "CAPTCHA token is required." });
        }

        const isCaptchaValid = await verifyCaptcha(captchaToken);
        if (!isCaptchaValid) {
            return res.status(400).json({ message: "CAPTCHA verification failed." });
        }

        if (formType !== "CANCEL") {
            return res.status(400).json({ message: "Invalid form type. Only CANCEL is allowed." });
        }

        const newCancelForm = new CancelForm({ userName, email, phoneNumber, feedback, formType });
        console.log("Incoming cancel form payload:", req.body);
        console.log("Saving form...");
        await newCancelForm.save();
        console.log("Saved successfully!");
        await sendEmail("sales@vtex.ai", `New Cancellation Request: ${userName}`,
            `User: ${userName}\nEmail: ${email}\nPhone: ${phoneNumber}\nCancellation Reason:\n${feedback}`,
            email
        );

        res.status(201).json({ message: "Cancellation form submitted successfully" });

    } catch (error) {
        console.error("🔥 CANCEL FORM ERROR:", error);
        res.status(500).json({
            message: "Error processing cancellation request",
            error: error.message,
            stack: error.stack
        });
    }
};

// 3. Update the feature request controller function
exports.submitFeatureRequest = async (req, res) => {
    try {
        const { isActiveUser, userName, email, phoneNumber, requestDetails, captchaToken, formType } = req.body;

        if (!userName || !email || !phoneNumber || !requestDetails) {
            return res.status(400).json({ message: "All fields are required." });
        }

        if (!captchaToken) {
            return res.status(400).json({ message: "CAPTCHA token is required." });
        }

        const isCaptchaValid = await verifyCaptcha(captchaToken);
        if (!isCaptchaValid) {
            return res.status(400).json({ message: "CAPTCHA verification failed." });
        }

        if (formType !== "FEATURE_REQUEST") {
            return res.status(400).json({ message: "Invalid form type. Only FEATURE_REQUEST is allowed." });
        }

        const newFeatureRequest = new FeatureRequest({ isActiveUser, userName, email, phoneNumber, requestDetails, formType });

        await newFeatureRequest.save();

        await sendEmail("sales@vtex.ai", `New Feature Request: ${userName}`,
            `User: ${userName}\nEmail: ${email}\nPhone: ${phoneNumber}\nFeature Request:\n${requestDetails}`,
            email // Sets Reply-To as user's email
        );

        res.status(201).json({ message: "Feature request submitted successfully" });

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error processing feature request", error: error.message });
    }
};