// auth.routes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controller/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const userRepository = require('../repository/user.repository');

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
    try {
      const token = req.user.token;
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/success?token=${token}&userId=${req.user.user._id}`;
      console.log("Redirecting to:", redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error during Google callback:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }
);

// LinkedIn OAuth routes
router.get('/linkedin', authController.handleLinkedInAuth);
router.get('/linkedin/callback', authController.handleLinkedInCallback);

module.exports = router;
