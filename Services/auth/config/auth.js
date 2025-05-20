// config.js (Full implementation)
module.exports = {
  // Database configuration
  mongoURI: process.env.MONGO_URI,
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '4d'
  },
  
  // Frontend URL for creating reset links (add this to your env variables)
  frontendURL: process.env.FRONTEND_URL || 'http://Vtex-ai.vercel.app',
  
  // Application name used in emails
  appName: process.env.APP_NAME || 'Vtex AI',
  
  // Email configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@yourdomain.com'
  },
  
  // OAuth configurations
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.FRONTEND_URL}/auth/google/callback`
  },
  
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: process.env.LINKEDIN_CALLBACK_URL || `${process.env.FRONTEND_URL}/auth/linkedin/callback`
  },
  
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    callbackURL: process.env.TWITTER_CALLBACK_URL || `${process.env.FRONTEND_URL}/auth/twitter/callback`
  },
  
  // reCAPTCHA configuration
  recaptcha: {
    secretKey: process.env.SECRET_KEY
  },
  
  // Klaviyo configuration
  klaviyo: {
    privateApiKey: process.env.KLAVIYO_PRIVATE_API_KEY
  }
};