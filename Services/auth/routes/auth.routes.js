// auth.routes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controller/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

require('dotenv').config();

// Local authentication routes
router.post('/login', authController.loginUser);
router.post('/logout', authenticateToken, authController.logoutUser);

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
    session: false 
  }),
  (req, res) => {
    // Create a proper redirect URL with token
    const token = req.user.token;
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}&userId=${req.user.user._id}`);
  }
);

// LinkedIn OAuth routes
router.get('/linkedin', authController.handleLinkedInAuth);
router.get('/linkedin/callback', authController.handleLinkedInCallback);

module.exports = router;
