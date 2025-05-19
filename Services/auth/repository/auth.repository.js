// auth.repository.js
const User = require('../models/user.model');
const BlacklistedToken = require('../models/blacklisted-token.model');
const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * Find a user by email
 * @param {string} email - User's email address
 * @returns {Promise<Object>} User object or null
 */
const findUserByEmail = async (email) => {
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        return user;
    } catch (error) {
        logger.error('Error finding user by email', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

/**
 * Blacklist a JWT token
 * @param {string} userId - User ID
 * @param {string} token - JWT token to blacklist
 * @returns {Promise<void>}
 */
const blacklistToken = async (userId, token) => {
    try {
        await BlacklistedToken.create({
            token,
            userId,
            blacklistedAt: new Date()
        });
    } catch (error) {
        logger.error('Error blacklisting token', {
            error: error.message,
            stack: error.stack,
            userId
        });
        throw error;
    }
};

/**
 * Save password reset token to user
 * @param {string} userId - User ID
 * @param {string} token - Hashed reset token
 * @param {Date} expiryDate - Token expiry date
 * @returns {Promise<void>}
 */
const saveResetToken = async (userId, token, expiryDate) => {
    try {
        await User.findByIdAndUpdate(userId, {
            passwordResetToken: token,
            passwordResetExpires: expiryDate
        });
    } catch (error) {
        logger.error('Error saving reset token', {
            error: error.message,
            stack: error.stack,
            userId
        });
        throw error;
    }
};

/**
 * Remove password reset token from user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const removeResetToken = async (userId) => {
    try {
        await User.findByIdAndUpdate(userId, {
            passwordResetToken: undefined,
            passwordResetExpires: undefined
        });
    } catch (error) {
        logger.error('Error removing reset token', {
            error: error.message,
            stack: error.stack,
            userId
        });
        throw error;
    }
};

/**
 * Find user with valid password reset token
 * @param {string} token - Hashed reset token
 * @returns {Promise<Object>} User object or null
 */
const findUserByResetToken = async (token) => {
    try {
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });
        return user;
    } catch (error) {
        logger.error('Error finding user by reset token', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

/**
 * Update user password and clear reset token
 * @param {string} userId - User ID
 * @param {string} hashedPassword - New hashed password
 * @returns {Promise<void>}
 */
const updatePasswordAndClearResetToken = async (userId, hashedPassword) => {
    try {
        await User.findByIdAndUpdate(userId, {
            password: hashedPassword,
            passwordResetToken: undefined,
            passwordResetExpires: undefined,
            passwordChangedAt: Date.now()
        });
    } catch (error) {
        logger.error('Error updating password', {
            error: error.message,
            stack: error.stack,
            userId
        });
        throw error;
    }
};

/**
 * Invalidate all tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const invalidateAllUserTokens = async (userId) => {
    try {
        await BlacklistedToken.updateMany(
            { userId, isValid: true },
            { isValid: false }
        );
    } catch (error) {
        logger.error('Error invalidating user tokens', {
            error: error.message,
            stack: error.stack,
            userId
        });
        throw error;
    }
};

module.exports = {
    findUserByEmail,
    blacklistToken,
    saveResetToken,
    removeResetToken,
    findUserByResetToken,
    updatePasswordAndClearResetToken,
    invalidateAllUserTokens
};