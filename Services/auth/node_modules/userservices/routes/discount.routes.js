const express = require('express');
const router = express.Router();
const discountController = require('../controller/discount.controller');

// CRUD routes
router.post('/', discountController.createDiscount);
router.get('/', discountController.getAllDiscounts);
router.get('/:id', discountController.getDiscountById);
router.put('/:id', discountController.updateDiscount);
router.delete('/:id', discountController.deleteDiscount);

// Business logic routes
router.post('/process', discountController.processDiscount);
router.post('/check-eligibility', discountController.checkEligibility);

module.exports = router;
