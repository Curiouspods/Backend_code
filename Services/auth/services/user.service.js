// user.service.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userRepository = require('../repository/user.repository');
const { encrypt, decrypt } = require('../config/encryption');
const logger = require('../config/logger');
const { ApiError } = require('../middleware/error.middleware');
const otpService = require('../services/otpService');
<<<<<<< HEAD

=======
>>>>>>> 6de6508767c3e41097f1c0bc93e14d8b2b6ecd57
const SALT_ROUNDS = 10;

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
            username
        } = userData;

        const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
        const phoneHash = phone_number ? crypto.createHash('sha256').update(phone_number).digest('hex') : null;

        if (await userRepository.findUserByEmailHash(emailHash)) {
            throw new ApiError(409, 'Email already registered');
        }

        if (phoneHash && await userRepository.findUserByPhoneHash(phoneHash)) {
            throw new ApiError(409, 'Phone number already registered');
        }

        if (await isUsernameTaken(username)) {
            throw new ApiError(409, 'Username already taken');
        }

        const encryptedEmail = encrypt(email);
        const encryptedPhone = phone_number ? encrypt(phone_number) : null;
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const encryptedAddress = address ? {
            state: address.state || null,
            country: address.country || null
        } : {};

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
            username
        });

        try {
            await otpService.generateAndSendOTP(newUser._id, email);
        } catch (otpError) {
            logger.error('OTP send failed', {
                error: otpError.message,
                stack: otpError.stack,
                userId: newUser._id
            });
        }

        return {
            id: newUser._id,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            email_verified: newUser.email_verified,
            status: newUser.status,
            username: newUser.username
        };

    } catch (error) {
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
        logger.error('Error retrieving user profile', {
            error: error.message,
            stack: error.stack,
            userId
        });
        throw new ApiError(500, 'Failed to retrieve user profile');
    }
};

const updateUserProfile = async (userId, updateData) => {
    try {
        const existingUser = await userRepository.findUserById(userId);
        if (!existingUser) throw new ApiError(404, 'User not found');

        const updateFields = {};

        ['first_name', 'last_name', 'DoB', 'industry', 'github_id'].forEach(f => {
            if (updateData[f]) updateFields[f] = updateData[f];
        });

        if (updateData.phone_number) {
            let currentPhone = null;
            try {
                currentPhone = existingUser.phone_number && decrypt(existingUser.phone_number);
            } catch { /* ignore */ }

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

        if (updateData.address) {
            updateFields.address = {
                state: updateData.address.state || existingUser.address?.state || null,
                country: updateData.address.country || existingUser.address?.country || null
            };
        }

        if (updateData.preferences) {
            updateFields.preferences = {
                notification_opt_in: updateData.preferences.notification_opt_in !== undefined
                    ? updateData.preferences.notification_opt_in
                    : existingUser.preferences?.notification_opt_in || false
            };
        }

        const updatedUser = await userRepository.updateUser(userId, updateFields);
        return updatedUser;

    } catch (error) {
        logger.error('Failed to update user profile', {
            error: error.message,
            stack: error.stack,
            userId
        });
        throw new ApiError(500, 'Failed to update user profile');
    }
};

<<<<<<< HEAD
=======
const changePassword = async (userId, currentPassword, newPassword) => {
    try {
        // Get full user object with password
        const user = await userRepository.findUserByIdWithPassword(userId);

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new ApiError(401, 'Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Update password
        await userRepository.updateUserPassword(userId, hashedPassword);

        return true;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        logger.error('Password change failed', {
            error: error.message,
            stack: error.stack,
            userId
        });

        throw new ApiError(500, 'Failed to change password');
    }
};
const registerOAuthUser = async (userData) => {
    try {
        const {
            email,
            first_name,
            last_name,
            twitter_id,
            linkedin_id,
            provider,
            status = 'active',
            email_verified = true
        } = userData;

        // Create consistent hash for email for lookup purposes
        const crypto = require('crypto');
        const emailHash = email ? 
            crypto.createHash('sha256').update(email.toLowerCase()).digest('hex') : 
            null;

        // If email is provided, check if it's already registered
        if (emailHash) {
            const existingUserByEmail = await userRepository.findUserByEmailHash(emailHash);
            if (existingUserByEmail) {
                // If the user exists but doesn't have this OAuth provider linked, we can update
                // This should be handled in auth.service, but we double-check here
                throw new ApiError(409, 'Email already registered');
            }
        }

        try {
            // Encrypt email if available
            const encryptedEmail = email ? encrypt(email) : null;

            // Create new user object
            const newUser = await userRepository.createUser({
                first_name: first_name || '',
                last_name: last_name || '',
                email: encryptedEmail,
                emailHash: emailHash,
                password: null, // OAuth users don't have passwords initially
                twitter_id: twitter_id || null,
                linkedin_id: linkedin_id || null,
                status: status,
                email_verified: email_verified,
                provider: provider,
                created_at: new Date(),
                login_history: [{
                    timestamp: new Date(),
                    method: provider,
                    success: true
                }]
            });

            return newUser;
        } catch (encryptionError) {
            logger.error('Encryption failed during OAuth user registration', {
                error: encryptionError.message,
                stack: encryptionError.stack
            });
            throw new ApiError(500, 'Failed to secure user data');
        }
    } catch (error) {
        // If it's already an ApiError, just rethrow it
        if (error instanceof ApiError) {
            throw error;
        }

        // Log and throw appropriate error
        logger.error('OAuth user registration failed', {
            error: error.message,
            stack: error.stack
        });

        throw new ApiError(500, error.message || 'OAuth registration failed');
    }
};
>>>>>>> a4d93229a3373ea1406c52c7dd1c9b082756b235
module.exports = {
    registerUser,
    getUserProfile,
    updateUserProfile,
<<<<<<< HEAD
    isUsernameTaken
=======
    changePassword,
    registerOAuthUser
>>>>>>> a4d93229a3373ea1406c52c7dd1c9b082756b235
};
