const Subscription = require('../models/Subscription');
const User = require('../models/User');
const subscriptionRepository = require('../repositories/subscriptionRepository');

/**
 * Check if a user is valid for code based on subscription status
 * @param {string} userId - The user ID to check
 * @returns {Object} - Object containing validity status and message
 */
const isValidForCode = async (userId) => {
    try {
        console.log(`Checking subscription for userId: ${userId}`);
        const subscription = await subscriptionRepository.findSubscriptionByUserId(userId);

        if (!subscription) {
            return { isValid: false, message: "Subscription not found" };
        }

        console.log("Subscription Data:", subscription); // Debugging output

        // 1. Check Subscription Status
        if (!subscription.Sub_status || subscription.Sub_status.toLowerCase() !== "active") {
            return { isValid: false, message: "Subscription status is not active" };
        }

        // 2. Check if Start Date is More than 35 Days Before Today
        const startDate = new Date(subscription.start_date);
        const currentDate = new Date();
        const dateDifference = Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24)); // Convert ms to days

        if (dateDifference > 35) {
            return { isValid: false, message: "Start date exceeds 35 days" };
        }

        // 3. Check CODE_STATUS
        if (subscription.CODE_STATUS && subscription.CODE_STATUS.toLowerCase() === "current") {
            return { isValid: false, message: "Code status is already current" };
        }

        return { isValid: true, message: "Valid for code" };
    } catch (error) {
        console.error("Error in subscriptionService.isValidForCode:", error);
        throw error; // Ensure it propagates properly
    }
};

/**
 * Get all inactive users based on defined criteria
 * @returns {Array} - Array of inactive users with reason for inactivity
 */
const getInactiveUsers = async () => {
    try {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        // Find users who haven't logged in for 3 months
        const inactiveByLogin = await subscriptionRepository.findInactiveUsersByLogin(threeMonthsAgo);

        // Find users with inactive or expired subscriptions
        const inactiveBySubscription = await subscriptionRepository.findInactiveSubscriptions(threeMonthsAgo);

        // Combine results and remove duplicates
        const combinedInactiveUsers = [
            ...inactiveByLogin.map(user => ({
                userId: user._id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                inactiveReason: "No login activity for 3+ months",
                lastLogin: user.last_login,
                lastActivity: user.last_activity
            })),
            ...inactiveBySubscription.map(sub => ({
                userId: sub.UserID,
                email: sub.email,
                inactiveReason: sub.Sub_status !== "active" ?
                    "Subscription not active" :
                    "Subscription expired over 3 months ago",
                subscriptionStatus: sub.Sub_status,
                endDate: sub.End_Date,
                startDate: sub.start_date,
                plan_id: sub.plan_id
            }))
        ];

        // Remove duplicates by userId
        const uniqueInactiveUsers = Array.from(
            new Map(combinedInactiveUsers.map(user => [user.userId.toString(), user])).values()
        );

        return uniqueInactiveUsers;
    } catch (error) {
        console.error("Error in getInactiveUsers:", error);
        throw error;
    }
};

/**
 * Check if a specific user is inactive
 * @param {string} userId - The user ID to check
 * @returns {Object} - User status information
 */
const checkUserInactiveStatus = async (userId) => {
    try {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Find the user's subscription
        const subscription = await subscriptionRepository.findSubscriptionByUserId(userId);

        // Check conditions for inactive status
        const isInactiveByLogin = !user.last_login || new Date(user.last_login) < threeMonthsAgo;

        const isInactiveBySubscription = !subscription ||
            subscription.Sub_status !== "active" ||
            (subscription.End_Date !== '31/12/9999' &&
                new Date(subscription.End_Date) < threeMonthsAgo);

        const isInactive = isInactiveByLogin || isInactiveBySubscription;

        // Determine the reason for inactivity
        let inactiveReason = null;
        if (isInactive) {
            if (isInactiveByLogin) {
                inactiveReason = "No login activity for 3+ months";
            } else if (!subscription) {
                inactiveReason = "No active subscription";
            } else if (subscription.Sub_status !== "active") {
                inactiveReason = "Subscription not active";
            } else {
                inactiveReason = "Subscription expired over 3 months ago";
            }
        }

        return {
            userId,
            email: user.email,
            isInactive,
            inactiveReason,
            lastLogin: user.last_login,
            lastActivity: user.last_activity,
            subscription: subscription ? {
                status: subscription.Sub_status,
                planId: subscription.plan_id,
                startDate: subscription.start_date,
                endDate: subscription.End_Date
            } : null
        };
    } catch (error) {
        console.error("Error in checkUserInactiveStatus:", error);
        throw error;
    }
};

/**
 * Update status for all inactive users and archive them
 * @returns {Object} - Result of the update operation
 */
const updateInactiveUserStatus = async () => {
    try {
        // Get all inactive users
        const inactiveUsers = await getInactiveUsers();
        const archivedUsers = [];
        const updatedUsers = [];

        // Process each inactive user: update status and archive
        for (const user of inactiveUsers) {
            try {
                // Find subscription for this user
                const subscription = await subscriptionRepository.findSubscriptionByUserId(user.userId);

                // First update user status to inactive
                const updatedUser = await subscriptionRepository.updateUserStatus(user.userId, 'inactive');
                if (updatedUser) {
                    updatedUsers.push({
                        userId: updatedUser._id,
                        email: updatedUser.email,
                        status: updatedUser.status
                    });
                }

                // Then archive and delete the user
                const archivedUser = await subscriptionRepository.archiveUser(user, subscription);
                if (archivedUser) {
                    archivedUsers.push({
                        userId: user.userId,
                        email: user.email,
                        archivedId: archivedUser._id
                    });
                }
            } catch (err) {
                console.error(`Error processing inactive user ${user.userId}:`, err);
                // Continue with other users even if one fails
            }
        }

        return {
            message: `${archivedUsers.length} users marked as inactive and archived`,
            updatedUsers,
            archivedUsers
        };
    } catch (error) {
        console.error("Error in updateInactiveUserStatus:", error);
        throw error;
    }
};
module.exports = {
    isValidForCode,
    getInactiveUsers,
    checkUserInactiveStatus,
    updateInactiveUserStatus
};