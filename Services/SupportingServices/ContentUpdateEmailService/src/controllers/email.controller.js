// File: src/controllers/email.controller.js
const fs = require('fs');
const klaviyoService = require('../services/klaviyo.services');
const excelService = require('../services/excel.services');

/**
 * Process Excel file and send emails via Klaviyo
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.sendEmails = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please upload an Excel file' 
      });
    }

    const filePath = req.file.path;
    
    // Process Excel file
    console.log(`Processing Excel file: ${filePath}`);
    const users = excelService.processExcelFile(filePath);
    
    if (!users || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid users found in the Excel file'
      });
    }

    console.log(`Found ${users.length} users in Excel file`);
    
    // Add users to Klaviyo list
    const klaviyoResponse = await klaviyoService.addUsersToList(users);
    
    // Clean up - remove uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
    
    // Return success response
    res.status(200).json({
      success: true,
      message: `Successfully processed ${users.length} users and sent to Klaviyo`,
      details: klaviyoResponse
    });
    
  } catch (error) {
    console.error('Error in sendEmails controller:', error);
    
    // Try to clean up file if it exists
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
    res.status(500).json({
      success: false,
      message: `Error processing request: ${error.message}`
    });
  }
};