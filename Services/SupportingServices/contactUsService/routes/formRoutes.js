const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');

// GET all forms
router.get('/getAllForms', formController.getAllForms);

// Cancel a form
router.put('/cancel/:id', formController.cancelForm);

// Single dynamic route to handle all form submissions
router.post('/:formType/:subType?', formController.submitForm);

module.exports = router;
