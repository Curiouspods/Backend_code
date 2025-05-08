const express = require('express');
const router = express.Router();
const Subscription =require('../controllers/SubscriptionControllers')


router.post('/add-user',Subscription.addUser)
router.post('/add-subscription',Subscription.addSubscription)
router.post('/update-subscription',Subscription.updateSubscription)

module.exports = router;
