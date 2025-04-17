const FlashMessage = require('../models/FlashMessage');
const moment = require('moment');

// Create a new flash message (for admin)
exports.createFlashMessage = async (req, res) => {
  try {
    const { message, type, validFrom, validTill } = req.body;

    // Validate date format and order
    const fromDate = moment(validFrom);
    const tillDate = moment(validTill);

    if (!fromDate.isValid() || !tillDate.isValid()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid date format. Use YYYY-MM-DD' 
      });
    }

    if (fromDate.isAfter(tillDate)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid from date must be before valid till date' 
      });
    }

    const flashMessage = await FlashMessage.create({
      message,
      type: type || 'info',
      validFrom,
      validTill
    });

    res.status(201).json({
      success: true,
      data: flashMessage
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get all active flash messages (for frontend)
exports.getActiveFlashMessages = async (req, res) => {
  try {
    const today = new Date();
    
    const flashMessages = await FlashMessage.find({
      validFrom: { $lte: today },
      validTill: { $gte: today }
    });

    res.status(200).json({
      success: true,
      count: flashMessages.length,
      data: flashMessages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all flash messages (for admin)
exports.getAllFlashMessages = async (req, res) => {
  try {
    const flashMessages = await FlashMessage.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: flashMessages.length,
      data: flashMessages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete a flash message (for admin)
exports.deleteFlashMessage = async (req, res) => {
  try {
    const flashMessage = await FlashMessage.findByIdAndDelete(req.params.id);

    if (!flashMessage) {
      return res.status(404).json({
        success: false,
        error: 'Flash message not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update a flash message (for admin)
exports.updateFlashMessage = async (req, res) => {
  try {
    const { message, type, validFrom, validTill } = req.body;

    // Validate date format and order if provided
    if (validFrom && validTill) {
      const fromDate = moment(validFrom);
      const tillDate = moment(validTill);

      if (!fromDate.isValid() || !tillDate.isValid()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid date format. Use YYYY-MM-DD' 
        });
      }

      if (fromDate.isAfter(tillDate)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Valid from date must be before valid till date' 
        });
      }
    }

    const flashMessage = await FlashMessage.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!flashMessage) {
      return res.status(404).json({
        success: false,
        error: 'Flash message not found'
      });
    }

    res.status(200).json({
      success: true,
      data: flashMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};