// File: src/routes/email.routes.js
const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');
const upload = require('../middleware/upload'); // Multer middleware

// POST /api/email/send – Accept Excel & process users
router.post('/send', upload.single('excelFile'), emailController.sendEmails);

module.exports = router;
