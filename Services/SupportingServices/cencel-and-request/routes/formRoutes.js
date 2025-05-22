const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const rateLimit = require('express-rate-limit');

// Limit submissions to 10 per day per IP
const formLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, 
    max: 10, 
    message: { status: 'error', message: 'Too many submissions today. Please try again tomorrow.' },
});

router.post('/cancel-form', formLimiter, formController.submitCancelForm);
router.post('/feature-request', formLimiter, formController.submitFeatureRequest);

module.exports = router;