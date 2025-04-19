const subscriptionService = require('../services/subscriptionService');
const subscriptionRepository = require('../repositories/subscriptionRepository');

// Original controller functions
const getAllSubscriptions = async (req, res) => {
    try {
        const subscriptions = await subscriptionRepository.findAllSubscriptions();
        res.json(subscriptions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getSubscriptionById = async (req, res) => {
    try {
        const subscription = await subscriptionRepository.findSubscriptionById(req.params.id);
        if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
        res.json(subscription);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const createSubscription = async (req, res) => {
    try {
        const newSubscription = await subscriptionRepository.createSubscription(req.body);
        res.status(201).json(newSubscription);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const updateSubscription = async (req, res) => {
    try {
        const updatedSubscription = await subscriptionRepository.updateSubscription(req.params.id, req.body);
        if (!updatedSubscription) return res.status(404).json({ message: 'Subscription not found' });
        res.json(updatedSubscription);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteSubscription = async (req, res) => {
    try {
        const subscription = await subscriptionRepository.deleteSubscription(req.params.id);
        if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
        res.json({ message: 'Subscription deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Validate subscription code
const isValidForCode = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const result = await subscriptionService.isValidForCode(userId);
        res.json(result);
    } catch (error) {
        console.error("Error in isValidForCode controller:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// New controller functions for inactive users
const getInactiveUsers = async (req, res) => {
    try {
        const inactiveUsers = await subscriptionService.getInactiveUsers();
        res.json({
            count: inactiveUsers.length,
            users: inactiveUsers
        });
    } catch (err) {
        console.error("Error in getInactiveUsers controller:", err);
        res.status(500).json({ message: err.message });
    }
};

const checkUserInactiveStatus = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const userStatus = await subscriptionService.checkUserInactiveStatus(userId);
        res.json(userStatus);
    } catch (err) {
        console.error("Error in checkUserInactiveStatus controller:", err);
        if (err.message === 'User not found') {
            res.status(404).json({ message: err.message });
        } else {
            res.status(500).json({ message: "Internal server error", error: err.message });
        }
    }
};

// Update inactive users status and archive them
const updateInactiveUserStatus = async (req, res) => {
    try {
        const result = await subscriptionService.updateInactiveUserStatus();
        res.json({
            success: true,
            ...result
        });
    } catch (err) {
        console.error("Error in updateInactiveUserStatus controller:", err);
        res.status(500).json({
            success: false,
            message: "Error updating inactive users",
            error: err.message
        });
    }
};

module.exports = {
    getAllSubscriptions,
    getSubscriptionById,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    isValidForCode,
    getInactiveUsers,
    checkUserInactiveStatus,
    updateInactiveUserStatus
};