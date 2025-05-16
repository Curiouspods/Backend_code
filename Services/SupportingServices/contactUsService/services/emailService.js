const nodemailer = require('nodemailer');
const dotenv = require("dotenv");

dotenv.config();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", 
    port: 587, 
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
    },
});

exports.sendEmail = async (userEmail, to, subject, text) => {
    try {
        const mailOptions = {
            from: `"VTEX Contact" <${process.env.EMAIL_USER}>`, // Always send from authenticated account
            to,
            subject,
            text,
            replyTo: userEmail, // So replies go to the user who submitted the form
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
