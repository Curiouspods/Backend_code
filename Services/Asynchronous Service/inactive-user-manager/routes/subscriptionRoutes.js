// routes/subscriptionRoutes.js
const express = require('express');
const {
  createSubscription,
  getSubscriptions,
  getSubscription
} = require('../controllers/subscriptionController');

const router = express.Router();

router.post('/create', createSubscription);
router.get('/', getSubscriptions);
router.get('/:id', getSubscription);

module.exports = router;