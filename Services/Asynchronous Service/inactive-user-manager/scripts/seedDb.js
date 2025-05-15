// scripts/seedDb.js
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
require('dotenv').config();

const seedSubscriptions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear existing subscriptions
    await Subscription.deleteMany({});
    
    // Create sample subscription plans
    const subscriptions = [
      {
        name: 'free',
        price: 0,
        duration: 365 * 10, // 10 years (effectively unlimited)
        features: ['Basic access', 'Limited storage']
      },
      {
        name: 'basic',
        price: 9.99,
        duration: 30, // 30 days
        features: ['Full access', 'Standard storage', 'Basic support']
      },
      {
        name: 'premium',
        price: 19.99,
        duration: 30, // 30 days
        features: ['Full access', 'Unlimited storage', 'Priority support', 'Advanced features']
      }
    ];
    
    await Subscription.insertMany(subscriptions);
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedSubscriptions();