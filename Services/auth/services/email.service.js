// email.service.js
const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

/**
 * Create nodemailer transporter
 */
const transporter = nodemailer.createTransport({
    service: config.email.service,
    auth: {
        user: config.email.user,
        pass: config.email.password
    }
});

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} resetUrl - Password reset URL
 * @returns {Promise<void>}
 */
const sendPasswordResetEmail = async (to, name, resetUrl) => {
    try {
        const mailOptions = {
            from: `"${config.appName}" <${config.email.from}>`,
            to,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset</h2>
                    <p>Hello ${name},</p>
                    <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
                    <p>To reset your password, click the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p>This link will expire in 1 hour for security reasons.</p>
                    <p>If you're having trouble clicking the button, copy and paste the URL below into your web browser:</p>
                    <p style="word-break: break-all;">${resetUrl}</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">This is an automated email. Please do not reply.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Password reset email sent to ${to}`);
    } catch (error) {
        logger.error('Error sending password reset email', {
            error: error.message,
            stack: error.stack,
            recipient: to
        });
        throw error;
    }
};

/**
 * Send password change confirmation email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @returns {Promise<void>}
 */
const sendPasswordChangeConfirmationEmail = async (to, name) => {
    try {
        const mailOptions = {
            from: `"${config.appName}" <${config.email.from}>`,
            to,
            subject: 'Password Successfully Changed',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Changed</h2>
                    <p>Hello ${name},</p>
                    <p>Your password has been successfully changed.</p>
                    <p>If you did not make this change, please contact our support team immediately.</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">This is an automated email. Please do not reply.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Password change confirmation email sent to ${to}`);
    } catch (error) {
        logger.error('Error sending password change confirmation email', {
            error: error.message,
            stack: error.stack,
            recipient: to
        });
        throw error;
    }
};

module.exports = {
    sendPasswordResetEmail,
    sendPasswordChangeConfirmationEmail
};