// user.repository.js
const User = require('../model/user.model');
const TokenBlacklist = require('../model/blackListToken.model');

const createUser = async (userData) => {
    return await User.create(userData);
};

const findUserByEmailHash = async (emailHash) => {
    return await User.findOne({ emailHash });
};

const findUserByPhoneHash = async (phoneHash) => {
    return await User.findOne({ phoneHash });
};

const findUserById = async (userId) => {
    return await User.findById(userId).select('-password');
};

const findUserByIdWithPassword = async (userId) => {
    return await User.findById(userId);
};

const updateUser = async (userId, updateData) => {
    return await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select('-password');
};

const updateUserPassword = async (userId, newHashedPassword) => {
    return await User.findByIdAndUpdate(
        userId,
        { $set: { password: newHashedPassword } },
        { new: true }
    );
};

const updateUserLastLogin = async (userId, ipAddress = null, deviceInfo = null) => {
    const loginData = {
        timestamp: new Date()
    };

    if (ipAddress) loginData.ip = ipAddress;
    if (deviceInfo) loginData.device = deviceInfo;

    return await User.findByIdAndUpdate(userId, {
        last_login: new Date(),
        $push: { login_history: loginData }
    });
};

const updateUserLastActivity = async (userId) => {
    return await User.findByIdAndUpdate(userId, {
        last_activity: new Date()
    });
};

const blacklistToken = async (token, userId, expiresAt) => {
    return await TokenBlacklist.create({ token, userId, expiresAt });
};

const storeUserOTP = async (userId, otpData) => {
    return await User.findByIdAndUpdate(userId, {
        otp: otpData
    });
};

const findUserWithOTP = async (userId) => {
    return await User.findById(userId).select('otp');
};

const removeUserOTP = async (userId) => {
    return await User.findByIdAndUpdate(userId, {
        $unset: { otp: "" }
    });
};

const activateUser = async (userId) => {
    return await User.findByIdAndUpdate(userId, {
        status: 'active',
        email_verified: true
    });
};
const findUserByUsername = async (username) => {
    return await User.findOne({ username: username });
};

const findUserByTwitterId = async (twitterId) => {
    try {
        const user = await User.findOne({ twitter_id: twitterId });
        return user;
    } catch (error) {
        throw new Error(`Error finding user by Twitter ID: ${error.message}`);
    }
};

const findUserByLinkedInId = async (linkedinId) => {
    try {
        const user = await User.findOne({ linkedin_id: linkedinId });
        return user;
    } catch (error) {
        throw new Error(`Error finding user by LinkedIn ID: ${error.message}`);
    }
};
module.exports = {
    createUser,
    findUserByEmailHash,
    findUserByPhoneHash,
    findUserById,
    findUserByIdWithPassword,
    updateUser,
    updateUserPassword,
    updateUserLastLogin,
    updateUserLastActivity,
    blacklistToken,
    storeUserOTP,
    findUserWithOTP,
    removeUserOTP,
    activateUser,
    findUserByUsername,
    activateUser,
    findUserByTwitterId,
    findUserByLinkedInId
};
