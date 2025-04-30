const Subscription = require('../models/Subscription');
const User = require('../models/User');
const ArchivedUser = require('../models/archievUsers.model');
const mongoose = require('mongoose');

// Original repository functions
const findAllSubscriptions = async () => {
    return await Subscription.find();
};

const findSubscriptionById = async (id) => {
    return await Subscription.findById(id);
};

const createSubscription = async (subscriptionData) => {
    const subscription = new Subscription(subscriptionData);
    return await subscription.save();
};

const updateSubscription = async (id, updateData) => {
    return await Subscription.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteSubscription = async (id) => {
    return await Subscription.findByIdAndDelete(id);
};

// New functions for inactive users
const findSubscriptionByUserId = async (userId) => {
    return await Subscription.findOne({ UserID: userId });
};

const findInactiveSubscriptions = async (threeMonthsAgo) => {
    return await Subscription.aggregate([
        {
            $match: {
                $or: [
                    { Sub_status: { $ne: "active" } },
                    {
                        start_date: { $exists: true },
                        End_Date: { $ne: '31/12/9999' },
                        End_Date: { $lt: threeMonthsAgo.toISOString() }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "UserID",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        {
            $project: {
                UserID: 1,
                email: 1,
                Sub_status: 1,
                plan_id: 1,
                End_Date: 1,
                start_date: 1,
                userDetails: { $arrayElemAt: ["$userDetails", 0] }
            }
        }
    ]);
};

const findInactiveUsersByLogin = async (threeMonthsAgo) => {
    return await User.find({
        $or: [
            { last_login: { $lt: threeMonthsAgo } },
            // { last_login: { $exists: false } }
        ]
    }).select('_id email last_login last_activity status first_name last_name');
};

const updateUserStatus = async (userId, status) => {
    return await User.findByIdAndUpdate(userId, { status }, { new: true });
};

const archiveUser = async (user, subscription) => {
    // Get complete user data
    const completeUser = await User.findById(user.userId || user._id);

    if (!completeUser) {
        throw new Error(`User with ID ${user.userId || user._id} not found for archiving`);
    }

    // Create archive record
    const archivedUser = new ArchivedUser({
        originalId: completeUser._id,
        email: completeUser.email,
        username: `${completeUser.first_name} ${completeUser.last_name}`,
        subscription: subscription ? {
            plan: subscription.plan_id,
            paymentMethod: "Unknown", // This info is not available in the current model
            expiresAt: subscription.End_Date !== '31/12/9999' ? new Date(subscription.End_Date) : null
        } : null,
        lastActiveAt: completeUser.last_activity || completeUser.last_login,
        userData: completeUser.toObject(), // Store the entire user document
        archivedAt: new Date()
    });

    // Save the archived record first
    const savedArchive = await archivedUser.save();

    // If archive was successful, delete the original user and their subscription
    if (savedArchive) {
        // Delete the user's subscription if it exists
        if (subscription) {
            await Subscription.findByIdAndDelete(subscription._id);
            console.log(`Subscription for user ${completeUser._id} successfully removed`);
        }

        // Delete the user
        await User.findByIdAndDelete(completeUser._id);
        console.log(`User ${completeUser._id} successfully archived and removed from users table`);
    }

    return savedArchive;
};

module.exports = {
    findAllSubscriptions,
    findSubscriptionById,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    findSubscriptionByUserId,
    findInactiveSubscriptions,
    findInactiveUsersByLogin,
    updateUserStatus,
    archiveUser
};