// user.controller.js
const userService = require('../services/user.service');
const otpService = require('../services/otpService');  
const { validateUserRegistration, validateUserUpdate, validatePasswordChange } = require('../validation/user.validation');
const logger = require('../config/logger');
const { ApiError } = require('../middleware/error.middleware');
const axios = require('axios');
const RECAPTCHA_SECRET_KEY = process.env.SECRET_KEY;

const registerUser = async (req, res, next) => {
    try {
        const { error } = validateUserRegistration(req.body);
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            throw new ApiError(400, 'Validation Error', errors);
        }

        const { captcha, username, ...userData } = req.body;

        // Require captcha in production
        if (!captcha) {
            throw new ApiError(400, 'CAPTCHA token is missing');
        }

        // Verify reCAPTCHA token
        const captchaResponse = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            {
                params: {
                    secret: RECAPTCHA_SECRET_KEY,
                    response: captcha
                }
            }
        );

        if (!captchaResponse.data.success) {
            logger.warn('CAPTCHA verification failed', {
                score: captchaResponse.data.score,
                errorCodes: captchaResponse.data['error-codes']
            });
            throw new ApiError(400, 'CAPTCHA verification failed');
        }

        const isUsernameTaken = await userService.isUsernameTaken(username);
        if (isUsernameTaken) {
            throw new ApiError(409, 'Username is already taken');
        }

        logger.info(`Registration attempt for email: ${userData.email.substring(0, 3)}...`);

        // Add logging to debug what is being sent
        logger.debug('Registering user with data:', { username, ...userData });

        const user = await userService.registerUser({ username, ...userData });

        try {
            await otpService.generateAndSendOTP(user._id, false);
        } catch (otpError) {
            logger.error('Failed to send verification email during registration', {
                error: otpError.message,
                stack: otpError.stack,
                userId: user._id
            });
        }

        logger.info(`User registered successfully: ${user._id}`);

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully. Please check your email for a verification code.',
            user: {
                id: user._id,
                status: user.status
            }
        });
    } catch (error) {
        // Add full diagnostic logging
        logger.error('Error occurred in registerUser', {
            message: error.message,
            stack: error.stack,
            data: req.body
        });

        if (error instanceof ApiError) return next(error);

        if (error.message === 'User already registered') {
            return next(new ApiError(409, 'Email is already registered'));
        }

        return next(new ApiError(500, 'Failed to register user', {
            message: error.message
        }));
    }
};

const verifyEmail = async (req, res, next) => {
    try {
        const { userId, otpCode } = req.body;
        if (!userId || !otpCode) {
            throw new ApiError(400, 'User ID and verification code are required');
        }

        await otpService.verifyOTPAndActivateUser(userId, otpCode);

        res.status(200).json({
            status: 'success',
            message: 'Email verified and account activated successfully'
        });
    } catch (error) {
        if (error instanceof ApiError) return next(error);
        next(new ApiError(500, 'Failed to verify email'));
    }
};

const resendOTP = async (req, res, next) => {
    try {
        const { userId } = req.body;
        if (!userId) throw new ApiError(400, 'User ID is required');

        const remainingAttempts = await otpService.getRemainingOTPResendAttempts(userId);
        if (remainingAttempts <= 0) {
            throw new ApiError(429, 'Maximum OTP resend limit reached. Please contact support.');
        }

        await otpService.generateAndSendOTP(userId, true);

        res.status(200).json({
            status: 'success',
            message: 'Verification code sent successfully',
            data: {
                remainingAttempts: remainingAttempts - 1,
                maxAttempts: otpService.MAX_OTP_RESEND_COUNT
            }
        });
    } catch (error) {
        if (error instanceof ApiError) return next(error);
        next(new ApiError(500, 'Failed to send verification code'));
    }
};

const getUserProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await userService.getUserProfile(userId);

        res.status(200).json({
            status: 'success',
            data: user
        });
    } catch (error) {
        if (error instanceof ApiError) return next(error);
        next(new ApiError(500, 'Failed to retrieve user profile'));
    }
};

const updateUserProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { error } = validateUserUpdate(req.body);

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            throw new ApiError(400, 'Validation Error', { errors });
        }

        const updatedUser = await userService.updateUserProfile(userId, req.body);

        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        if (error instanceof ApiError) return next(error);

        logger.error('Profile update failed', {
            error: error.message,
            stack: error.stack,
            userId: req.user.id
        });

        next(new ApiError(500, 'Failed to update profile'));
    }
};

const changePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        const { error } = validatePasswordChange(req.body);
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            throw new ApiError(400, 'Validation Error', { errors });
        }

        await userService.changePassword(userId, currentPassword, newPassword);

        logger.info(`Password changed successfully for user: ${userId}`);

        res.status(200).json({
            status: 'success',
            message: 'Password changed successfully'
        });
    } catch (error) {
        if (error instanceof ApiError) return next(error);

        logger.error('Password change failed', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.id
        });

        next(new ApiError(500, 'Failed to change password'));
    }
};

module.exports = {
    registerUser,
    verifyEmail,
    resendOTP,
    getUserProfile,
    updateUserProfile,
    changePassword
};