// user.controller.js
const userService = require('../services/user.service');
<<<<<<< HEAD
const otpService = require('../services/otpService');  
=======
const otpService = require('../services/otpService');
>>>>>>> origin/staging
const { validateUserRegistration, validateUserUpdate, validatePasswordChange } = require('../validation/user.validation');
const logger = require('../config/logger');
const { ApiError } = require('../middleware/error.middleware');
const axios = require('axios');
<<<<<<< HEAD
const RECAPTCHA_SECRET_KEY = process.env.SECRET_KEY;

const registerUser = async (req, res, next) => {
    try {
=======
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

const registerUser = async (req, res, next) => {
    try {

>>>>>>> origin/staging
        const { error } = validateUserRegistration(req.body);
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
<<<<<<< HEAD
            throw new ApiError(400, 'Validation Error', errors);
        }

        const { captcha, username, ...userData } = req.body;

        // Require captcha in production
=======

            throw new ApiError(400, 'Validation Error', errors);
        }

        // 1. CAPTCHA validation
        const { captcha, ...userData } = req.body;

>>>>>>> origin/staging
        if (!captcha) {
            throw new ApiError(400, 'CAPTCHA token is missing');
        }

<<<<<<< HEAD
        // Verify reCAPTCHA token
=======
>>>>>>> origin/staging
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
<<<<<<< HEAD
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
=======
            throw new ApiError(400, 'CAPTCHA verification failed');
        }
        
        // 3. Log registration attempt (without sensitive data)
        logger.info(`Registration attempt for email: ${userData.email.substring(0, 3)}...`);

        // 4. Register the user
        const user = await userService.registerUser({ ...userData, captcha });
>>>>>>> origin/staging

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
<<<<<<< HEAD
        // Add full diagnostic logging
        logger.error('Error occurred in registerUser', {
            message: error.message,
            stack: error.stack,
            data: req.body
        });

        if (error instanceof ApiError) return next(error);
=======
        if (error instanceof ApiError) {
            return next(error);
        }
>>>>>>> origin/staging

        if (error.message === 'User already registered') {
            return next(new ApiError(409, 'Email is already registered'));
        }

<<<<<<< HEAD
        return next(new ApiError(500, 'Failed to register user', {
            message: error.message
        }));
=======
        next(new ApiError(500, 'Failed to register user', error));
>>>>>>> origin/staging
    }
};

const verifyEmail = async (req, res, next) => {
    try {
        const { userId, otpCode } = req.body;
<<<<<<< HEAD
=======

>>>>>>> origin/staging
        if (!userId || !otpCode) {
            throw new ApiError(400, 'User ID and verification code are required');
        }

<<<<<<< HEAD
=======
        // Verify OTP and activate user
>>>>>>> origin/staging
        await otpService.verifyOTPAndActivateUser(userId, otpCode);

        res.status(200).json({
            status: 'success',
            message: 'Email verified and account activated successfully'
        });
    } catch (error) {
<<<<<<< HEAD
        if (error instanceof ApiError) return next(error);
=======
        if (error instanceof ApiError) {
            return next(error);
        }

>>>>>>> origin/staging
        next(new ApiError(500, 'Failed to verify email'));
    }
};

const resendOTP = async (req, res, next) => {
    try {
        const { userId } = req.body;
<<<<<<< HEAD
        if (!userId) throw new ApiError(400, 'User ID is required');

        const remainingAttempts = await otpService.getRemainingOTPResendAttempts(userId);
=======

        if (!userId) {
            throw new ApiError(400, 'User ID is required');
        }

        // Check remaining attempts before sending
        const remainingAttempts = await otpService.getRemainingOTPResendAttempts(userId);

>>>>>>> origin/staging
        if (remainingAttempts <= 0) {
            throw new ApiError(429, 'Maximum OTP resend limit reached. Please contact support.');
        }

<<<<<<< HEAD
        await otpService.generateAndSendOTP(userId, true);

=======
        // Generate and send new OTP (with resend flag set to true)
        await otpService.generateAndSendOTP(userId, true);

        // Calculate remaining attempts after this resend
        const updatedRemainingAttempts = remainingAttempts - 1;

>>>>>>> origin/staging
        res.status(200).json({
            status: 'success',
            message: 'Verification code sent successfully',
            data: {
<<<<<<< HEAD
                remainingAttempts: remainingAttempts - 1,
=======
                remainingAttempts: updatedRemainingAttempts,
>>>>>>> origin/staging
                maxAttempts: otpService.MAX_OTP_RESEND_COUNT
            }
        });
    } catch (error) {
<<<<<<< HEAD
        if (error instanceof ApiError) return next(error);
=======
        if (error instanceof ApiError) {
            return next(error);
        }

>>>>>>> origin/staging
        next(new ApiError(500, 'Failed to send verification code'));
    }
};

const getUserProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
<<<<<<< HEAD
=======

        // Get user profile
>>>>>>> origin/staging
        const user = await userService.getUserProfile(userId);

        res.status(200).json({
            status: 'success',
            data: user
        });
    } catch (error) {
<<<<<<< HEAD
        if (error instanceof ApiError) return next(error);
=======
        if (error instanceof ApiError) {
            return next(error);
        }

>>>>>>> origin/staging
        next(new ApiError(500, 'Failed to retrieve user profile'));
    }
};

const updateUserProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
<<<<<<< HEAD
        const { error } = validateUserUpdate(req.body);

        if (error) {
=======

        // Validate input data
        const { error } = validateUserUpdate(req.body);
        if (error) {
            // Format validation errors
>>>>>>> origin/staging
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
<<<<<<< HEAD
            throw new ApiError(400, 'Validation Error', { errors });
        }

=======

            throw new ApiError(400, 'Validation Error', { errors });
        }

        // Update user profile
>>>>>>> origin/staging
        const updatedUser = await userService.updateUserProfile(userId, req.body);

        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
<<<<<<< HEAD
        if (error instanceof ApiError) return next(error);
=======
        if (error instanceof ApiError) {
            return next(error);
        }
>>>>>>> origin/staging

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

<<<<<<< HEAD
        const { error } = validatePasswordChange(req.body);
        if (error) {
=======
        // Validate input
        const { error } = validatePasswordChange(req.body);
        if (error) {
            // Format validation errors
>>>>>>> origin/staging
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
<<<<<<< HEAD
            throw new ApiError(400, 'Validation Error', { errors });
        }

        await userService.changePassword(userId, currentPassword, newPassword);

=======

            throw new ApiError(400, 'Validation Error', { errors });
        }

        // Change password
        await userService.changePassword(userId, currentPassword, newPassword);

        // Log activity
>>>>>>> origin/staging
        logger.info(`Password changed successfully for user: ${userId}`);

        res.status(200).json({
            status: 'success',
            message: 'Password changed successfully'
        });
    } catch (error) {
<<<<<<< HEAD
        if (error instanceof ApiError) return next(error);
=======
        if (error instanceof ApiError) {
            return next(error);
        }
>>>>>>> origin/staging

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
<<<<<<< HEAD
};
=======
};
>>>>>>> origin/staging
