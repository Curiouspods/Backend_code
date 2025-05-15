// controllers/subscriptionController.js
const Subscription = require('../models/Subscription');

// Create a subscription plan
const createSubscription = async (req, res) => {
  try {
    const { name, price, duration, features } = req.body;
    
    const existingSubscription = await Subscription.findOne({ name });
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Subscription plan already exists'
      });
    }
    
    const newSubscription = new Subscription({
      name,
      price,
      duration,
      features
    });
    
    await newSubscription.save();
    
    res.status(201).json({
      success: true,
      data: newSubscription
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all subscription plans
const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ isActive: true });
    
    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single subscription plan
const getSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createSubscription,
  getSubscriptions,
  getSubscription
};