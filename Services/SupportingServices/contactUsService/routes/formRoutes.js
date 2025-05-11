const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const rateLimit = require('express-rate-limit');

// Create a rate limiter for form submissions
// This limits each IP to 5 form submissions per hour
const formSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many form submissions from this IP, please try again after an hour'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// GET all forms
router.get('/getAllForms', formController.getAllForms);

// Cancel a form
router.put('/cancel/:id', formController.cancelForm);

// Apply rate limiter specifically to form submissions
router.post('/:formType/:subType?', formSubmissionLimiter, formController.submitForm);

module.exports = router;