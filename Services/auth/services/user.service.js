// user.service.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userRepository = require('../repository/user.repository');
const { encrypt,decrypt } = require('../config/encryption');
const logger = require('../config/logger');
const { ApiError } = require('../middleware/error.middleware');
const otpService = require('../services/otpService');
const SALT_ROUNDS = 10;

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
        } = userData;

        // Create consistent hash for email for lookup purposes
        const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');

        // Create consistent hash for phone number (if provided) for lookup purposes
        const phoneHash = phone_number ?
            crypto.createHash('sha256').update(phone_number).digest('hex') :
            null;

        // Check if user already exists with hashed email
        const existingUserByEmail = await userRepository.findUserByEmailHash(emailHash);
        if (existingUserByEmail) {
            logger.warn(`Registration attempt with existing email: ${email.substring(0, 3)}...`);
            throw new ApiError(409, 'Email already registered');
        }

        // Check if user already exists with hashed phone number (if provided)
        if (phoneHash) {
            const existingUserByPhone = await userRepository.findUserByPhoneHash(phoneHash);
            if (existingUserByPhone) {
                logger.warn(`Registration attempt with existing phone: ${phone_number.substring(0, 3)}...`);
                throw new ApiError(409, 'Phone number already registered');
            }
        }

        try {
            // Encrypt the actual data for storage
            const encryptedEmail = encrypt(email);
            const encryptedPhone = phone_number ? encrypt(phone_number) : null;

            // Hash password
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            // For address data
            const encryptedAddress = address ? {
                state: address.state ? address.state : null,
                country: address.country ? address.country : null
            } : {};

            // Create new user object with encrypted data and hashed identifiers
            const newUser = await userRepository.createUser({
                first_name: first_name,
                last_name: last_name,
                DoB: DoB,
                industry: industry,
                email: encryptedEmail,
                emailHash: emailHash, // Store the hash for lookup
                password: hashedPassword,
                phone_number: encryptedPhone,
                phoneHash: phoneHash, // Store the hash for lookup
                address: encryptedAddress,
                status: 'inactive',
                email_verified: false,
                preferences: preferences || { notification_opt_in: false },
                github_id:github_id,
                provider: 'local',
                created_at: new Date(),
                login_history: []
            });

            try {
                await otpService.generateAndSendOTP(newUser._id, email);
            } catch (otpError) {
                logger.error('Failed to send verification email during registration', {
                    error: otpError.message,
                    stack: otpError.stack,
                    userId: newUser._id
                });
            }

            return newUser;
        } catch (encryptionError) {
            console.error('Encryption failure details:', encryptionError);
            logger.error('Encryption failed during user registration', {
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

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        return user;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

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
        // Check if user exists
        const existingUser = await userRepository.findUserById(userId);
        if (!existingUser) {
            throw new ApiError(404, 'User not found');
        }

        // Prepare data for update
        const updateFields = {};

        // Handle basic fields
        if (updateData.first_name) updateFields.first_name = updateData.first_name;
        if (updateData.last_name) updateFields.last_name = updateData.last_name;
        if (updateData.DoB) updateFields.DoB = updateData.DoB;
        if (updateData.industry) updateFields.industry = updateData.industry;
        if (updateData.github_id) {
            updateFields.github_id = updateData.github_id;
        }


        // Handle phone number if provided and changed
        if (updateData.phone_number && (!existingUser.phone_number ||
            (decrypt(existingUser.phone_number) !== updateData.phone_number))) {

            // Create consistent hash for new phone number
            const phoneHash = crypto.createHash('sha256').update(updateData.phone_number).digest('hex');

            // Check if phone number is already in use by another user
            const existingUserByPhone = await userRepository.findUserByPhoneHash(phoneHash);
            if (existingUserByPhone && existingUserByPhone._id.toString() !== userId) {
                throw new ApiError(409, 'Phone number already registered by another user');
            }

            // Encrypt the phone number
            updateFields.phone_number = encrypt(updateData.phone_number);
            updateFields.phoneHash = phoneHash;
        }

        // Handle address update
        if (updateData.address) {
            updateFields.address = {
                state: updateData.address.state || existingUser.address?.state || null,
                country: updateData.address.country || existingUser.address?.country || null
            };
        }

        // Handle preferences update
        if (updateData.preferences) {
            updateFields.preferences = {
                notification_opt_in: updateData.preferences.notification_opt_in !== undefined ?
                    updateData.preferences.notification_opt_in :
                    existingUser.preferences?.notification_opt_in || false
            };
        }

        // Update user in database
        const updatedUser = await userRepository.updateUser(userId, updateFields);

        // Return updated user without sensitive fields
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
            github_id: updatedUser.github_id ? updatedUser.github_id:"",

        };

    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        logger.error('User profile update failed', {
            error: error.message,
            stack: error.stack,
            userId
        });

        throw new ApiError(500, 'Failed to update user profile');
    }
};

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
module.exports = {
    registerUser,
    getUserProfile,
    updateUserProfile,
    changePassword,
    registerOAuthUser
};
