const User = require('../models/User');
const ArchivedUser = require('../models/ArchivedUser');

const archiveUser = async (user) => {
  try {
    // Create a copy of the user in the archive database
    const archivedUser = new ArchivedUser({
      originalId: user._id,
      email: user.email,
      username: user.username,
      subscription: user.subscription,
      lastActiveAt: user.lastActiveAt,
      userData: user.toObject() // Store the complete user object
    });
    
    // Save to archive
    await archivedUser.save();
    
    // Delete from main database
    await User.findByIdAndDelete(user._id);
    
    return archivedUser;
  } catch (error) {
    console.error('Error archiving user:', error);
    throw error;
  }
};

const retrieveArchivedUser = async (userId) => {
  try {
    return await ArchivedUser.findOne({ originalId: userId });
  } catch (error) {
    console.error('Error retrieving archived user:', error);
    throw error;
  }
};

// Get all inactive users based on conditions
const getInactiveUsers = async () => {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    // Find users matching any of the inactive conditions
    const inactiveUsers = await User.find({
      $or: [
        // Condition (a): No subscription purchase or renewal for 3 months
        {
          'subscription.lastPurchaseDate': { $lt: threeMonthsAgo }
        },
        // Condition (b): Subscription cancelled/expired with no new one for 3 months
        {
          'subscription.status': { $in: ['cancelled', 'expired'] },
          'subscription.endDate': { $lt: threeMonthsAgo }
        },
        // Condition (c): No login for 3 months
        {
          lastLoginAt: { $lt: threeMonthsAgo }
        }
      ]
    });
    
    return inactiveUsers;
  } catch (error) {
    console.error('Error finding inactive users:', error);
    throw error;
  }
};

// Bulk archive inactive users
const archiveInactiveUsers = async () => {
  try {
    const inactiveUsers = await getInactiveUsers();
    const results = {
      total: inactiveUsers.length,
      archived: 0,
      failed: 0,
      errors: []
    };
    
    for (const user of inactiveUsers) {
      try {
        await archiveUser(user);
        results.archived++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          userId: user._id,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in bulk archiving inactive users:', error);
    throw error;
  }
};

module.exports = { 
  archiveUser, 
  retrieveArchivedUser,
  getInactiveUsers,
  archiveInactiveUsers
};