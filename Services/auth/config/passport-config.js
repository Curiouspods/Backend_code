const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const User = require('../model/user.model');
const jwt = require('jsonwebtoken');
const { encrypt } = require('./encryption');
const logger = require('./logger');

// Load environment variables (only once)
require('dotenv').config();

const createEmailHash = (email) => {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(email).digest('hex');
}

const SECRET_KEY = process.env.JWT_SECRET || 'yourSecretKey';

// Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/user.birthday.read',
      'https://www.googleapis.com/auth/user.addresses.read'
    ],
    accessType: 'offline'  // Needed for refresh tokens
}, async (accessToken, refreshToken, profile, done) => {
    try {
        logger.info(`Google authentication attempt for: ${profile.id}`);

        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
            const nameParts = profile.displayName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            user = await User.create({
                first_name: firstName,
                last_name: lastName,
                email: encrypt(profile.emails[0].value),
                emailHash: createEmailHash(profile.emails[0].value), // Add this line
                industry: 'technology', // Default value or extract from profile
                dob: profile._json?.birthday || null,  // Date of Birth
                address: profile._json?.addresses?.[0] || null
                status: 'active',
                provider: 'google',
                providerId: profile.id,
                preferences: {
                    notification_opt_in: false
                }
            });

            logger.info(`New user created via Google authentication: ${user._id}`);
        } else {
            logger.info(`Existing user logged in via Google: ${user._id}`);
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return done(null, { user, token });
    } catch (error) {
        logger.error('Google authentication error', {
            error: error.message,
            stack: error.stack,
            profileId: profile.id
        });
        return done(error, null);
    }
}));

// LinkedIn OAuth strategy
passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: "/api/auth/linkedin/callback",
    scope: ['r_emailaddress', 'r_liteprofile']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        logger.info(`LinkedIn authentication attempt for: ${profile.id}`);

        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
            // Split display name into first and last name
            const nameParts = profile.displayName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            user = await User.create({
                first_name: encrypt(firstName),
                last_name: encrypt(lastName),
                email: encrypt(profile.emails[0].value),
                status: 'active',
                provider: 'linkedin',
                providerId: profile.id,
                preferences: {
                    notification_opt_in: false
                }
            });

            logger.info(`New user created via LinkedIn authentication: ${user._id}`);
        } else {
            logger.info(`Existing user logged in via LinkedIn: ${user._id}`);
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        return done(null, { user, token });
    } catch (error) {
        logger.error('LinkedIn authentication error', {
            error: error.message,
            stack: error.stack,
            profileId: profile.id
        });
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

module.exports = passport;
