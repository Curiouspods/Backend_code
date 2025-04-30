// user.service.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userRepository = require('../repository/user.repository');
const { encrypt, decrypt } = require('../config/encryption');
const logger = require('../config/logger');
const { ApiError } = require('../middleware/error.middleware');
const otpService = require('../services/otpService');

const SALT_ROUNDS = 10;

/**
 * Check if a username is already taken.
 */
const isUsernameTaken = async (username) => {
    if (!username) return false;
    const existing = await userRepository.findUserByUsername(username);
    return !!existing;
};

const registerUser = async (userData) => {
    try {
        const {
            first_name,
            last_name,
            DoB,
            industry,
            email,
            password,
            phone_number,
            address,
            preferences,
            github_id,
            username,
        } = userData;

        // 1) Hashes for lookup
        const emailHash = crypto.createHash('sha256')
                                 .update(email.toLowerCase())
                                 .digest('hex');
        const phoneHash = phone_number
            ? crypto.createHash('sha256').update(phone_number).digest('hex')
            : null;

        // 2) Uniqueness checks
        if (await userRepository.findUserByEmailHash(emailHash)) {
            throw new ApiError(409, 'Email already registered');
        }
        if (phoneHash && await userRepository.findUserByPhoneHash(phoneHash)) {
            throw new ApiError(409, 'Phone number already registered');
        }
        if (await isUsernameTaken(username)) {
            throw new ApiError(409, 'Username already taken');
        }

        // 3) Encryption & hashing
        const encryptedEmail = encrypt(email);
        const encryptedPhone = phone_number ? encrypt(phone_number) : null;
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const encryptedAddress = address ? {
            state: address.state || null,
            country: address.country || null
        } : {};

        // 4) Create user
        const newUser = await userRepository.createUser({
            first_name,
            last_name,
            DoB,
            industry,
            email: encryptedEmail,
            emailHash,
            password: hashedPassword,
            phone_number: encryptedPhone,
            phoneHash,
            address: encryptedAddress,
            status: 'inactive',
            email_verified: false,
            preferences: preferences || { notification_opt_in: false },
            github_id,
            provider: 'local',
            created_at: new Date(),
            login_history: [],
            username,
        });

        // 5) Send OTP (best effort)
        try {
            await otpService.generateAndSendOTP(newUser._id, email);
        } catch (otpError) {
            logger.error('OTP send failed', {
                error: otpError.message,
                stack: otpError.stack,
                userId: newUser._id
            });
        }

        // 6) Return sanitized
        return {
            id: newUser._id,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            email_verified: newUser.email_verified,
            status: newUser.status,
            username: newUser.username,
        };

    } catch (error) {
        if (error instanceof ApiError) throw error;

        logger.error('User registration failed', {
            error: error.message,
            stack: error.stack
        });
        throw new ApiError(500, error.message || 'Registration failed');
    }
};

const getUserProfile = async (userId) => {
    try {
        const user = await userRepository.findUserById(userId);
        if (!user) throw new ApiError(404, 'User not found');
        return user;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        logger.error('Error retrieving user profile', { error: error.message, stack: error.stack, userId });
        throw new ApiError(500, 'Failed to retrieve user profile');
    }
};

const updateUserProfile = async (userId, updateData) => {
    try {
        const existingUser = await userRepository.findUserById(userId);
        if (!existingUser) throw new ApiError(404, 'User not found');

        const updateFields = {};

        // Basic fields
        ['first_name', 'last_name', 'DoB', 'industry', 'github_id'].forEach(f => {
            if (updateData[f]) updateFields[f] = updateData[f];
        });

        // Phone update
        if (updateData.phone_number) {
            let currentPhone = null;
            try { currentPhone = existingUser.phone_number && decrypt(existingUser.phone_number); }
            catch { /* ignore */ }

            if (updateData.phone_number !== currentPhone) {
                const newPhoneHash = crypto.createHash('sha256')
                                           .update(updateData.phone_number)
                                           .digest('hex');
                const conflict = await userRepository.findUserByPhoneHash(newPhoneHash);
                if (conflict && conflict._id.toString() !== userId) {
                    throw new ApiError(409, 'Phone number already registered by another user');
                }
                updateFields.phone_number = encrypt(updateData.phone_number);
                updateFields.phoneHash = newPhoneHash;
            }
        }

        // Address
        if (updateData.address) {
            updateFields.address = {
                state: updateData.address.state || existingUser.address?.state || null,
                country: updateData.address.country || existingUser.address?.country || null
            };
        }

        // Preferences
        if (updateData.preferences) {
            updateFields.preferences = {
                notification_opt_in: updateData.preferences.notification_opt_in !== undefined
                    ? updateData.preferences.notification_opt_in
                    : existingUser.preferences?.notification_opt_in
            };
        }

        const updatedUser = await userRepository.updateUser(userId, updateFields);
        return {
            id: updatedUser._id,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            DoB: updatedUser.DoB,
            industry: updatedUser.industry,
            address: updatedUser.address,
            preferences: updatedUser.preferences,
            status: updatedUser.status,
            email_verified: updatedUser.email_verified,
            github_id: updatedUser.github_id || "",
            username: updatedUser.username
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        logger.error('User profile update failed', { error: error.message, stack: error.stack, userId });
        throw new ApiError(500, 'Failed to update user profile');
    }
};

const changePassword = async (userId, currentPassword, newPassword) => {
    try {
        const user = await userRepository.findUserByIdWithPassword(userId);
        if (!user) throw new ApiError(404, 'User not found');

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) throw new ApiError(401, 'Current password is incorrect');

        const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await userRepository.updateUserPassword(userId, hashed);
        return true;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        logger.error('Password change failed', { error: error.message, stack: error.stack, userId });
        throw new ApiError(500, 'Failed to change password');
    }
};

module.exports = {
    isUsernameTaken,
    registerUser,
    getUserProfile,
    updateUserProfile,
    changePassword
};
