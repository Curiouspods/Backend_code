const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

// Get all subscriptions
router.get('/', subscriptionController.getAllSubscriptions);

// Get subscription by ID
router.get('/:id', subscriptionController.getSubscriptionById);

// Create a new subscription
router.post('/', subscriptionController.createSubscription);

// Update subscription
router.patch('/:id', subscriptionController.updateSubscription);

// Delete subscription
router.delete('/:id', subscriptionController.deleteSubscription);

// Validate subscription code (FIXED FUNCTION NAME)
if (!subscriptionController.isValidForCode) {
    throw new Error("isValidForCode is not defined in subscriptionController.js");
}
router.post("/isValidForCode", subscriptionController.isValidForCode);

// Get all inactive users
router.get('/inactive/users', subscriptionController.getInactiveUsers);

// Check if a specific user is inactive
router.get('/inactive/user/:userId', subscriptionController.checkUserInactiveStatus);

// Update status for all inactive users
router.post('/inactive/update-status', subscriptionController.updateInactiveUserStatus);

module.exports = router;
