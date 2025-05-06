  const User = require('../models/user');
  const birthdayService = require('../services/birthdayService');

  // Create a new user
  exports.createUser = async (req, res) => {
    try {
      const { email, firstName, lastName, dateOfBirth } = req.body;
      
      const user = new User({
        email,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        isActive: true,
        lastLogin: new Date()
      });
      
      await user.save();
      
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  // Update user's last login
  exports.updateLastLogin = async (req, res) => {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      user.lastLogin = new Date();
      await user.save();
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  // Manually trigger birthday check (for testing)
  exports.triggerBirthdayCheck = async (req, res) => {
    try {
      const sentCount = await birthdayService.checkAndSendBirthdayEmails();
      
      res.status(200).json({
        success: true,
        message: `Birthday check completed. Sent ${sentCount} emails.`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  // Get user by email (for testing)
  exports.getUserByEmail = async (req, res) => {
    try {
      const { email } = req.params;
      
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          ...user.toObject(),
          isBirthday: user.isBirthday(),
          isInactive: user.isInactive(),
          emailAlreadySent: user.birthdayEmailAlreadySent()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };