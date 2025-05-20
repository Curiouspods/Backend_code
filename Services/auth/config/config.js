module.exports = {
    frontendURL: process.env.FRONTEND_URL || 'http://localhost:3000',
    email: {
        service: process.env.EMAIL_SERVICE || 'gmail',
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        password: process.env.EMAIL_PASSWORD || 'your-email-password'
    },
};
