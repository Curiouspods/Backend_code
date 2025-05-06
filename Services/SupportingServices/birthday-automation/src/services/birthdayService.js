const User = require('../models/user');
const klaviyoService = require('./klaviyoService');

class BirthdayService {
  async checkAndSendBirthdayEmails() {
    try {
      console.log('Checking for birthdays...');
      
      // Get all users
      const users = await User.find({});
      let sentCount = 0;
      
      for (const user of users) {
        // Check if it's the user's birthday today
        if (user.isBirthday()) {
          // Check if we already sent a birthday email this year
          if (!user.birthdayEmailAlreadySent()) {
            // Send birthday email via Klaviyo
            const emailSent = await klaviyoService.sendBirthdayEmail(user);
            
            if (emailSent) {
              // Mark as sent for this year
              user.markBirthdayEmailSent();
              await user.save();
              sentCount++;
              
              console.log(`Birthday email sent to ${user.email}`);
            }
          } else {
            console.log(`Birthday email already sent this year to ${user.email}`);
          }
        }
      }
      
      console.log(`Birthday check completed. Sent ${sentCount} emails.`);
      return sentCount;
    } catch (error) {
      console.error('Error in birthday service:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new BirthdayService();
