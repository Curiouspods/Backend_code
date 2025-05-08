// src/routes/klaviyo.routes.js
const express = require('express');
const router = express.Router();
const klaviyoController = require('../controllers/klaviyo.controller');

// POST /api/klaviyo/trigger-content-update
router.post('/trigger-content-update', klaviyoController.triggerContentUpdate);

module.exports = router;
