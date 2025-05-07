// src/controllers/klaviyo.controller.js
const klaviyoService = require('../services/klaviyo.services');

/**
 * Controller for triggering Content Update reminder event in Klaviyo
 */
exports.triggerContentUpdate = async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      userId,
      updatedContentTitle,
      category
    } = req.body;

    const result = await klaviyoService.triggerContentUpdate({
      email,
      firstName,
      lastName,
      userId,
      updatedContentTitle,
      category
    });

    return res.status(202).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
