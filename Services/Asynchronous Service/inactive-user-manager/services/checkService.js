const User = require('../models/User');
const emailService = require('./emailService');
const archiveService = require('./archiveService');

// Number of days before sending the first reminder
const FIRST_REMINDER_DAYS = 75; // 2.5 months, before the 3-month cutoff
// Number of days after sending the first reminder to send the final reminder
const FINAL_REMINDER_DAYS = 7;
// Number of days after sending the final reminder to archive the user
const ARCHIVE_DAYS = 7;

const checkInactiveUsers = async () => {
  const now = new Date();
  
  try {
    // Find users approaching inactivity (before they hit the 3-month mark)
    const firstReminderDate = new Date(now);
    firstReminderDate.setDate(now.getDate() - FIRST_REMINDER_DAYS);
    
    // For potential inactive users, get users who:
    // 1. Haven't made a subscription purchase in almost 3 months
    // 2. Have a cancelled/expired subscription approaching 3 months
    // 3. Haven't logged in for almost 3 months
    // And haven't been sent the first reminder yet
    const potentialInactiveUsers = await User.find({
      firstReminderSent: { $ne: true },
      $or: [
        {
          'subscription.lastPurchaseDate': { 
            $lt: firstReminderDate,
            $gt: new Date(firstReminderDate.getTime() - (7 * 24 * 60 * 60 * 1000)) // Within a week of the cutoff
          }
        },
        {
          'subscription.status': { $in: ['cancelled', 'expired'] },
          'subscription.endDate': { 
            $lt: firstReminderDate,
            $gt: new Date(firstReminderDate.getTime() - (7 * 24 * 60 * 60 * 1000))
          }
        },
        {
          lastLoginAt: { 
            $lt: firstReminderDate,
            $gt: new Date(firstReminderDate.getTime() - (7 * 24 * 60 * 60 * 1000))
          }
        }
      ]
    });
    
    // Send first reminder to potentially inactive users
    for (const user of potentialInactiveUsers) {
      await emailService.sendFirstReminder(user);
      user.firstReminderSent = true;
      await user.save();
      console.log(`First reminder sent to ${user.email}`);
    }
    
    // Check users who received the first reminder but not the final one
    const finalReminderDate = new Date(now);
    finalReminderDate.setDate(now.getDate() - FINAL_REMINDER_DAYS);
    
    const usersForFinalReminder = await User.find({
      firstReminderSent: true,
      finalReminderSent: { $ne: true },
      lastReminderSentAt: { $lt: finalReminderDate }
    });
    
    // Send final reminder
    for (const user of usersForFinalReminder) {
      await emailService.sendFinalReminder(user);
      user.finalReminderSent = true;
      user.lastReminderSentAt = new Date();
      await user.save();
      console.log(`Final reminder sent to ${user.email}`);
    }
    
    // Check users who should be archived
    const archiveDate = new Date(now);
    archiveDate.setDate(now.getDate() - ARCHIVE_DAYS);
    
    const usersToArchive = await User.find({
      finalReminderSent: true,
      lastReminderSentAt: { $lt: archiveDate }
    });
    
    // Archive users
    for (const user of usersToArchive) {
      await archiveService.archiveUser(user);
      console.log(`User ${user.email} archived`);
    }
    
    // Also run a check for any users who directly meet the inactive criteria
    const inactiveUsers = await archiveService.getInactiveUsers();
    for (const user of inactiveUsers) {
      // Only archive users who haven't been notified yet
      if (!user.firstReminderSent && !user.finalReminderSent) {
        await archiveService.archiveUser(user);
        console.log(`User ${user.email} archived (met inactive criteria)`);
      }
    }
    
    console.log('Inactive user check completed');
  } catch (error) {
    console.error('Error in checkInactiveUsers:', error);
  }
};

// Manual check for inactive users
const processInactiveUsers = async () => {
  try {
    const results = await archiveService.archiveInactiveUsers();
    return results;
  } catch (error) {
    console.error('Error processing inactive users:', error);
    throw error;
  }
};

module.exports = { 
  checkInactiveUsers,
  processInactiveUsers
};