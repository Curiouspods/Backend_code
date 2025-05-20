// auth.controller.js
const authService = require('../services/auth.service');
const logger = require('../config/logger');
const { ApiError } = require('../middleware/error.middleware');
const passport = require('passport');
const axios = require('axios');
const authRepository = require('../repository/auth.repository');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const config = require('../config/config');
const emailService = require('../services/email.service');

const loginUser = async (req, res, next) => {
    try {
        const { email, password, captchaToken } = req.body;

        if (!email || !password) {
            throw new ApiError(400, 'Email and password are required');
        }

        // Require captcha in production
        if (!captchaToken) {
            throw new ApiError(400, 'Captcha token is required');
        }

        // Verify reCAPTCHA
        const secretKey = process.env.SECRET_KEY;
        const captchaVerifyURL = `https://www.google.com/recaptcha/api/siteverify`;

        const response = await axios.post(captchaVerifyURL, null, {
            params: {
                secret: secretKey,
                response: captchaToken
            }
        });

        const { success } = response.data;

        if (!success) {
            logger.warn('CAPTCHA verification failed', {
                errorCodes: response.data['error-codes']
            });
            throw new ApiError(403, 'Captcha verification failed');
        }

        const ipAddress = req.ip || req.connection.remoteAddress;
        const deviceInfo = req.headers['user-agent'];

        logger.info(`Login attempt for email: ${email.substring(0, 3)}...`);

        const result = await authService.loginUser(email, password, ipAddress, deviceInfo);

        if (result && result.verificationRequired) {
            logger.warn(`Login failed: Account not active for email: ${email}`);
            return res.status(403).json({
                status: 'fail',
                message: result.message,
                email: result.email,
                userId: result.userId,
                verificationRequired: true
            });
        }

        const { user, token } = result;
        logger.info(`User logged in successfully: ${user.id}`);
        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: user,
            token
        });

    } catch (error) {
        if (error instanceof ApiError) return next(error);

        logger.error('Login error', {
            error: error.message,
            stack: error.stack
        });

        next(new ApiError(500, 'Authentication failed'));
    }
};

const logoutUser = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        logger.info(`Logout requested for user: ${userId}`);

        await authService.logoutUser(userId, token);

        logger.info(`User logged out successfully: ${userId}`);

        res.status(200).json({
            status: 'success',
            message: 'Logout successful'
        });

    } catch (error) {
        logger.error('Logout error', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.id
        });

        next(new ApiError(500, 'Logout failed'));
    }
};
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            throw new ApiError(400, 'Email is required');
        }

        // Find user by email
        const user = await authRepository.findUserByEmail(email);

        // If no user found, still return to avoid leaking user existence
        if (!user) {
            logger.info(`Password reset requested for non-existent email: ${email.substring(0, 3)}...`);
            return res.status(200).json({ message: 'If the email exists, a reset link will be sent.' });
        }

        // Generate a reset token that expires in 1 hour
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Save the hashed token and expiry to the user document
        const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await authRepository.saveResetToken(user.id, hashedToken, passwordResetExpires);

        // Create reset URL
        const resetURL = `${config.frontendURL}/auth/reset-password?token=${resetToken}`;

        // Log the details before sending the email
        logger.info('Preparing to send password reset email', {
            email: email,
            name: user.firstName || 'User',
            resetURL
        });

        // Send email with the reset link
        await emailService.sendPasswordResetEmail(
            email,
            user.firstName || 'User',
            resetURL
        );

        logger.info(`Password reset email sent to: ${email.substring(0, 3)}...`);
        res.status(200).json({ message: 'Password reset email sent successfully.' });
    } catch (error) {
        if (error instanceof ApiError) return next(error);

        logger.error('Error in forgotPassword', {
            error: error.message,
            stack: error.stack
        });
        next(new ApiError(500, 'An error occurred while processing the request'));
    }
};

/**
 * Reset password using a valid token
 * @param {string} token - The reset token from the email
 * @param {string} newPassword - The new password
 * @returns {Promise<void>}
 */
const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            throw new ApiError(400, 'Token and new password are required');
        }

        // Hash the token from the request to compare with the stored hash
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid reset token and non-expired reset date
        const user = await authRepository.findUserByResetToken(hashedToken);

        if (!user) {
            throw new ApiError(400, 'Invalid or expired reset token');
        }

        // Check if token is expired
        const now = new Date();
        if (user.passwordResetExpires < now) {
            throw new ApiError(400, 'Reset token has expired');
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user's password and clear reset token
        await authRepository.updatePasswordAndClearResetToken(user.id, hashedPassword);

        logger.info(`Password successfully reset for user: ${user.id}`);

        // Optionally: Send confirmation email
        try {
            await emailService.sendPasswordChangeConfirmationEmail(
                user.email,
                user.firstName || 'User'
            );
        } catch (error) {
            logger.error('Failed to send password change confirmation email', {
                error: error.message,
                userId: user.id
            });
            // Don't throw here - password was reset successfully
        }

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        if (error instanceof ApiError) return next(error);

        logger.error('Error in resetPassword', {
            error: error.message,
            stack: error.stack
        });
        next(new ApiError(500, 'An error occurred while processing the request'));
    }
};
/**
 * Google OAuth Initiation
 */
const handleGoogleAuth = (req, res, next) => {
    logger.info('Google authentication initiated');
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })(req, res, next);
};

/**
 * Google OAuth Callback
 */
const handleGoogleCallback = (req, res, next) => {
    passport.authenticate('google', {
        failureRedirect: '/login',
        session: false
    }, (err, user) => {
        if (err) {
            logger.error('Google auth callback error', { error: err.message });
            return next(new ApiError(500, 'Authentication failed'));
        }

        if (!user) {
            logger.warn('Google auth failed - no user returned');
            return res.redirect('/login?error=auth_failed');
        }

        logger.info(`Google auth successful for user: ${user.user._id}`);
        res.json({
            status: 'success',
            message: "Google Login Successful",
            data: {
                id: user.user._id,
                status: user.user.status
            },
            token: user.token
        });
    })(req, res, next);
};

/**
 * LinkedIn OAuth Initiation
 */
const handleLinkedInAuth = (req, res, next) => {
    logger.info('LinkedIn authentication initiated');
    passport.authenticate('linkedin', {
        session: false
    })(req, res, next);
};

/**
 * LinkedIn OAuth Callback (Passport)
 */
const handleLinkedInCallback = (req, res, next) => {
    passport.authenticate('linkedin', {
        failureRedirect: '/login',
        session: false
    }, (err, user) => {
        if (err) {
            logger.error('LinkedIn auth callback error', { error: err.message });
            return next(new ApiError(500, 'Authentication failed'));
        }

        if (!user) {
            logger.warn('LinkedIn auth failed - no user returned');
            return res.redirect('/login?error=auth_failed');
        }

        logger.info(`LinkedIn auth successful for user: ${user.user._id}`);
        res.json({
            status: 'success',
            message: "LinkedIn Login Successful",
            data: {
                id: user.user._id,
                status: user.user.status
            },
            token: user.token
        });
    })(req, res, next);
};

/**
 * Twitter OAuth Callback (via API code)
 */
const twitterCallback = async (req, res, next) => {
    try {
        const { code } = req.body;

        if (!code) {
            throw new ApiError(400, 'Twitter authorization code is required');
        }

        const result = await authService.handleTwitterAuth(code);

        res.status(200).json({
            status: 'success',
            message: result.isNewUser ? 'User registered successfully via Twitter' : 'Logged in via Twitter',
            data: {
                user: result.user,
                token: result.token,
                isNewUser: result.isNewUser
            }
        });
    } catch (error) {
        if (error instanceof ApiError) return next(error);

        logger.error('Twitter OAuth callback failed', {
            error: error.message,
            stack: error.stack
        });

        next(new ApiError(500, 'Twitter authentication failed'));
    }
};

/**
 * LinkedIn OAuth Callback (via API code)
 */
const linkedinCallback = async (req, res, next) => {
    try {
        const { code } = req.body;

        if (!code) {
            throw new ApiError(400, 'LinkedIn authorization code is required');
        }

        const result = await authService.handleLinkedInAuth(code);

        res.status(200).json({
            status: 'success',
            message: result.isNewUser ? 'User registered successfully via LinkedIn' : 'Logged in via LinkedIn',
            data: {
                user: result.user,
                token: result.token,
                isNewUser: result.isNewUser
            }
        });
    } catch (error) {
        if (error instanceof ApiError) return next(error);

        logger.error('LinkedIn OAuth callback failed', {
            error: error.message,
            stack: error.stack
        });

        next(new ApiError(500, 'LinkedIn authentication failed'));
    }
};

module.exports = {
    loginUser,
    logoutUser,
    handleGoogleAuth,
    handleGoogleCallback,
    handleLinkedInAuth,
    handleLinkedInCallback,
    twitterCallback,
    linkedinCallback,
    forgotPassword,
    resetPassword
};
