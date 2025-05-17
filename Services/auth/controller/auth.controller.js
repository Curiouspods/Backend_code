// auth.controller.js
const authService = require('../services/auth.service');
const logger = require('../config/logger');
const { ApiError } = require('../middleware/error.middleware');
const passport = require('passport');
const axios = require('axios');

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
    console.log('LinkedIn authentication initiated');  
    logger.info('LinkedIn authentication initiated');
    passport.authenticate('linkedin', {
        scope: ['w_member_social', 'openid', 'profile', 'email'], 
    })(req, res, next);
};

/**
 * LinkedIn OAuth Callback (Passport)
 */
const handleLinkedInCallback = async (req, res, next) => {
    try {
        const { code } = req.query; // Assuming the authorization code is passed as a query parameter

        if (!code) {
            throw new ApiError(400, 'LinkedIn authorization code is required');
        }

        // Use the authService to handle LinkedIn authentication
        const result = await authService.handleLinkedInAuth(code);

        // Redirect to the client page with the redirect URL
        res.redirect(result.redirectUrl);
    } catch (error) {
        if (error instanceof ApiError) return next(error);

        logger.error('LinkedIn OAuth callback failed', {
            error: error.message,
            stack: error.stack
        });

        next(new ApiError(500, 'LinkedIn authentication failed'));
    }
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
    linkedinCallback
};
