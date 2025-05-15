const archiveService = require('../services/archiveService');
const inactivityService = require('../services/inactivityService');
const ArchivedUser = require('../models/ArchivedUser');

// Get all archived users
const getArchivedUsers = async (req, res) => {
  try {
    const archivedUsers = await ArchivedUser.find();
    
    res.status(200).json({
      success: true,
      count: archivedUsers.length,
      data: archivedUsers
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single archived user
const getArchivedUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const archivedUser = await archiveService.retrieveArchivedUser(userId);
    if (!archivedUser) {
      return res.status(404).json({
        success: false,
        message: 'Archived user not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: archivedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Manually archive a user
const manuallyArchiveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const User = require('../models/User');
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const archivedUser = await archiveService.archiveUser(user);
    
    res.status(200).json({
      success: true,
      message: 'User successfully archived',
      data: archivedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all inactive users based on criteria
const getInactiveUsers = async (req, res) => {
  try {
    const inactiveUsers = await archiveService.getInactiveUsers();
    
    res.status(200).json({
      success: true,
      count: inactiveUsers.length,
      data: inactiveUsers
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Process and archive all inactive users
const processInactiveUsers = async (req, res) => {
  try {
    const results = await inactivityService.processInactiveUsers();
    
    res.status(200).json({
      success: true,
      message: 'Inactive users processed',
      results
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Trigger inactivity checks and reminders
const runInactivityChecks = async (req, res) => {
  try {
    await inactivityService.checkInactiveUsers();
    
    res.status(200).json({
      success: true,
      message: 'Inactivity checks and reminders sent'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getArchivedUsers,
  getArchivedUser,
  manuallyArchiveUser,
  getInactiveUsers,
  processInactiveUsers,
  runInactivityChecks
};