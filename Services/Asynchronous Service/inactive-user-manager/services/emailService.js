// services/emailService.js
const nodemailer = require('nodemailer');

// This is a simplified email service for testing purposes
// In production, you would use a real email provider like SendGrid, Mailgun, etc.
const sendEmail = async (options) => {
  // Create a test transporter - for development only
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  // Email options
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@yourapp.com',
    to: options.email,
    subject: options.subject,
    html: options.html,
    text: options.text
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);
  
  console.log('Email sent:', info.messageId);
  
  return info;
};

// Send first reminder to user approaching inactivity
exports.sendFirstReminder = async (user) => {
  try {
    const subject = 'We miss you! Your account will soon be inactive';
    const html = `
      <h1>Hi ${user.username},</h1>
      <p>We noticed you haven't been active on our platform recently.</p>
      <p>Your account will be considered inactive in 2 weeks if you don't log in or renew your subscription.</p>
      <p>Log in now to keep your account active!</p>
      <a href="${process.env.SITE_URL}/login" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Log In Now</a>
      <p>If you have any questions, please contact our support team.</p>
      <p>Best regards,<br>Your App Team</p>
    `;
    
    await sendEmail({
      email: user.email,
      subject,
      html,
      text: `Hi ${user.username}, We noticed you haven't been active on our platform recently. Your account will be considered inactive in 2 weeks if you don't log in or renew your subscription. Log in now to keep your account active!`
    });
    
    return true;
  } catch (error) {
    console.error('Error sending first reminder email:', error);
    throw error;
  }
};

// Send final reminder to user about to be archived
exports.sendFinalReminder = async (user) => {
  try {
    const subject = 'FINAL NOTICE: Your account will be archived soon';
    const html = `
      <h1>Hi ${user.username},</h1>
      <p>This is your <strong>final notice</strong> that your account will be archived in 7 days due to inactivity.</p>
      <p>Once archived, you'll need to contact support to restore your account and data.</p>
      <p>To prevent archiving, simply log in to your account or renew your subscription:</p>
      <a href="${process.env.SITE_URL}/login" style="padding: 10px 20px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px;">Log In Now</a>
      <p>If you have any questions, please contact our support team immediately.</p>
      <p>Best regards,<br>Your App Team</p>
    `;
    
    await sendEmail({
      email: user.email,
      subject,
      html,
      text: `Hi ${user.username}, This is your FINAL NOTICE that your account will be archived in 7 days due to inactivity. Once archived, you'll need to contact support to restore your account and data. To prevent archiving, simply log in to your account or renew your subscription.`
    });
    
    return true;
  } catch (error) {
    console.error('Error sending final reminder email:', error);
    throw error;
  }
};