// auth.service.js
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userRepository = require('../repository/user.repository');
const userService = require('./user.service');
const { encrypt } = require('../config/encryption');
const logger = require('../config/logger');
const { ApiError } = require('../middleware/error.middleware');

const SECRET_KEY = process.env.JWT_SECRET || 'yourSecretKey';
const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '7d';

// Twitter OAuth settings
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const TWITTER_CALLBACK_URL = process.env.TWITTER_CALLBACK_URL;

// LinkedIn OAuth settings
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_CALLBACK_URL = process.env.LINKEDIN_CALLBACK_URL;

const generateToken = (user) => {
    const payload = typeof user === 'object' ? {
        id: user._id,
        email: user.emailHash,
        status: user.status
    } : { id: user };

    return jwt.sign(payload, SECRET_KEY, { expiresIn: TOKEN_EXPIRY });
};

const loginUser = async (email, password, ipAddress = null, deviceInfo = null) => {
    try {
        const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
        const user = await userRepository.findUserByEmailHash(emailHash);

        if (!user) throw new ApiError(401, 'Invalid credentials');
        if (user.provider !== 'local' && !user.password) throw new ApiError(400, `This account uses ${user.provider} authentication`);
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new ApiError(401, 'Invalid credentials');
        
        if (user.status !== 'active') {
            return {
                verificationRequired: true,
                message: 'Account is not active. Please verify your email to activate your account.',
                email: user.email,
                userId: user._id
            };
        }

        const token = generateToken(user);
        await userRepository.updateUserLastLogin(user._id, ipAddress, deviceInfo);

        return {
            user: {
                id: user._id,
                status: user.status
            },
            token
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;

        logger.error('User login failed', { error: error.message, stack: error.stack });
        throw new ApiError(500, error.message || 'Login failed');
    }
};

const logoutUser = async (userId, token = null) => {
    try {
        await userRepository.updateUserLastActivity(userId);

        if (token) {
            try {
                const decoded = jwt.verify(token, SECRET_KEY, { ignoreExpiration: true });
                const expiryDate = new Date(decoded.exp * 1000);
                await userRepository.blacklistToken(token, userId, expiryDate);
            } catch (tokenError) {
                logger.warn('Could not decode token for blacklisting', { error: tokenError.message, userId });
            }
        }

        return true;
    } catch (error) {
        logger.error('Logout error', { error: error.message, stack: error.stack, userId });
        throw new ApiError(500, 'Logout failed');
    }
};

const handleOAuthLogin = async (profile, provider) => {
    try {
        logger.info(`${provider} OAuth login attempt for: ${profile.email || 'No email provided'}`);

        let userData = {};
        if (provider === 'twitter') {
            userData = {
                email: profile.email,
                first_name: profile.name?.split(' ')[0] || '',
                last_name: profile.name?.split(' ').slice(1).join(' ') || '',
                twitter_id: profile.id,
                provider: 'twitter',
                status: 'active',
                email_verified: true
            };
        } else if (provider === 'linkedin') {
            userData = {
                email: profile.email,
                first_name: profile.localizedFirstName || profile.given_name || '',
                last_name: profile.localizedLastName || profile.family_name || '',
                linkedin_id: profile.id,
                provider: 'linkedin',
                status: 'active',
                email_verified: true
            };
        }

        if (userData.email) {
            const emailHash = crypto.createHash('sha256').update(userData.email.toLowerCase()).digest('hex');
            const existingUser = await userRepository.findUserByEmailHash(emailHash);

            if (existingUser) {
                const updateData = {};
                if (provider === 'twitter' && !existingUser.twitter_id) updateData.twitter_id = userData.twitter_id;
                else if (provider === 'linkedin' && !existingUser.linkedin_id) updateData.linkedin_id = userData.linkedin_id;

                if (Object.keys(updateData).length > 0) {
                    await userRepository.updateUser(existingUser._id, updateData);
                }

                const token = generateToken(existingUser);

                if (token)
                    return {
                        redirectUrl: `${process.env.FRONTEND_URL}/auth/success?token=${token}&userId=${existingUser._id}&isNewUser=false`
                    };
                else
                    return {
                        redirectUrl: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
                    };
            }
        }

        const newUser = await userService.registerOAuthUser(userData);
        const token = generateToken(newUser);

        if (token)
            return {
                redirectUrl: `${process.env.FRONTEND_URL}/auth/success?token=${token}&userId=${existingUser._id}&isNewUser=false`
            };
        else
            return {
                redirectUrl: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
            };
    } catch (error) {
        logger.error(`${provider} OAuth login failed`, { error: error.message, stack: error.stack });
        throw new ApiError(500, `${provider} login failed: ${error.message}`);
    }
};

const handleTwitterAuth = async (code) => {
    try {
        const tokenResponse = await axios.post('https://api.twitter.com/2/oauth2/token', null, {
            params: {
                code,
                grant_type: 'authorization_code',
                client_id: TWITTER_CLIENT_ID,
                redirect_uri: TWITTER_CALLBACK_URL,
                code_verifier: 'challenge'
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            auth: {
                username: TWITTER_CLIENT_ID,
                password: TWITTER_CLIENT_SECRET
            }
        });

        const { access_token } = tokenResponse.data;

        const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
            headers: {
                Authorization: `Bearer ${access_token}`
            },
            params: {
                'user.fields': 'id,name,username,profile_image_url,email'
            }
        });

        const profile = userResponse.data.data;
        return await handleOAuthLogin(profile, 'twitter');
    } catch (error) {
        logger.error('Twitter OAuth process failed', { error: error.message, stack: error.stack });
        throw new ApiError(500, `Twitter authentication failed: ${error.message}`);
    }
};

const handleLinkedInAuth = async (code) => {
    try {
        const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
            params: {
                grant_type: 'authorization_code',
                code,
                redirect_uri: LINKEDIN_CALLBACK_URL,
                client_id: LINKEDIN_CLIENT_ID,
                client_secret: LINKEDIN_CLIENT_SECRET
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        // console.log('Token Response:', tokenResponse.data); // Debugging token response

        const { access_token } = tokenResponse.data.access_token;
        const { id_token } = tokenResponse.data.id_token;

        const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${tokenResponse.data.access_token}`
            }
        });

        // console.log('Profile Response:', profileResponse); // Debugging profile response

        profile = profileResponse.data;

        return await handleOAuthLogin(profile, 'linkedin');
    } catch (error) {
        console.error('Error during LinkedIn OAuth process', {
            error: error.message,
            stack: error.stack
        });
        console.error('LinkedIn OAuth process failed', {
            error: error.response?.data || error.message,
            stack: error.stack
        });
        throw new ApiError(500, `LinkedIn authentication failed: ${error.message}`);
    }
};

module.exports = {
    loginUser,
    logoutUser,
    handleTwitterAuth,
    handleLinkedInAuth,
    generateToken
};
