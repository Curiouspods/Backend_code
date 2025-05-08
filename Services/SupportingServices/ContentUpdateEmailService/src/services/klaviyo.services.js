// File: src/services/klaviyo.services.js
const axios = require('axios');
require('dotenv').config();

const PRIVATE_API_KEY = process.env.KLAVIYO_PRIVATE_API_KEY;
const LIST_ID = process.env.KLAVIYO_LIST_ID || 'Yj25Zs';

/**
 * Get profile ID by email
 * @param {string} email - User email
 * @returns {string|null} - Profile ID or null if not found
 */
const getProfileIdByEmail = async (email) => {
  try {
    // URL encode the email
    const encodedEmail = encodeURIComponent(email);
    
    const response = await axios.get(
      `https://a.klaviyo.com/api/profiles/?filter=equals(email,"${encodedEmail}")`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Klaviyo-API-Key ${PRIVATE_API_KEY}`,
          revision: '2023-10-15'
        }
      }
    );
    
    return response.data?.data?.[0]?.id || null;
  } catch (error) {
    console.error(`Error getting profile for ${email}:`, error.message);
    return null;
  }
};

/**
 * Add or update users in Klaviyo and add them to a list
 * @param {Array} users - Array of user objects with email, firstName, lastName
 * @returns {Object} - Status and message
 */
exports.addUsersToList = async (users) => {
  if (!PRIVATE_API_KEY) throw new Error('Klaviyo private API key not configured');
  if (!LIST_ID) throw new Error('Klaviyo list ID not configured');

  const results = [];

  try {
    for (const user of users) {
      try {
        // Step 1: Find existing profile or create new one
        let profileId = await getProfileIdByEmail(user.email);
        
        if (profileId) {
          // Profile exists – update it
          await axios.patch(
            `https://a.klaviyo.com/api/profiles/${profileId}`,
            {
              data: {
                type: 'profile',
                id: profileId,
                attributes: {
                  first_name: user.firstName,
                  last_name: user.lastName || '',
                  // Add any additional properties
                  properties: Object.keys(user)
                    .filter(key => !['firstName', 'lastName', 'email'].includes(key))
                    .reduce((obj, key) => {
                      obj[key] = user[key];
                      return obj;
                    }, {})
                }
              }
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Klaviyo-API-Key ${PRIVATE_API_KEY}`,
                revision: '2023-10-15'
              }
            }
          );
        } else {
          // Profile doesn't exist – create it
          const profileResponse = await axios.post(
            'https://a.klaviyo.com/api/profiles',
            {
              data: {
                type: 'profile',
                attributes: {
                  email: user.email,
                  first_name: user.firstName,
                  last_name: user.lastName || '',
                  // Add any additional properties
                  properties: Object.keys(user)
                    .filter(key => !['firstName', 'lastName', 'email'].includes(key))
                    .reduce((obj, key) => {
                      obj[key] = user[key];
                      return obj;
                    }, {})
                }
              }
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Klaviyo-API-Key ${PRIVATE_API_KEY}`,
                revision: '2023-10-15'
              }
            }
          );
          
          profileId = profileResponse.data?.data?.id;
          
          if (!profileId) {
            throw new Error('Failed to create profile');
          }
        }
        
        // Step 2: Add to list
        await axios.post(
          `https://a.klaviyo.com/api/lists/${LIST_ID}/relationships/profiles`,
          {
            data: [
              {
                type: 'profile',
                id: profileId
              }
            ]
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Klaviyo-API-Key ${PRIVATE_API_KEY}`,
              revision: '2023-10-15'
            }
          }
        );
        
        results.push({
          email: user.email,
          status: 'success'
        });
        
        console.log(`[✅] Successfully processed ${user.email}`);
      } catch (userError) {
        console.error(`[❌] Error processing ${user.email}:`, userError.message);
        results.push({
          email: user.email,
          status: 'error',
          message: userError.message
        });
      }
    }
    
    const successCount = results.filter(r => r.status === 'success').length;
    
    return {
      status: 200,
      message: `Processed ${users.length} users: ${successCount} successful, ${users.length - successCount} failed`,
      details: results
    };
  } catch (error) {
    console.error('Klaviyo API error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    const errorMsg = error.response?.data?.errors?.[0]?.detail ||
                   error.response?.data?.message ||
                   error.message;
                   
    throw new Error(`Failed to add users to Klaviyo list: ${errorMsg}`);
  }
};

/**
 * Triggers a content update event in Klaviyo
 * @param {Object} user - user data
 */
exports.triggerContentUpdate = async (user) => {
  const PUBLIC_API_KEY = process.env.KLAVIYO_PUBLIC_API_KEY;
  
  if (!PUBLIC_API_KEY) throw new Error('Klaviyo public API key not configured');

  try {
    const payload = {
      token: PUBLIC_API_KEY,
      event: 'ContentUpdateTrigger',
      customer_properties: {
        $email: user.email,
        $first_name: user.firstName,
        $last_name: user.lastName,
        user_id: user.userId
      },
      properties: {
        updated_content_title: user.updatedContentTitle,
        category: user.category,
        update_time: new Date().toISOString()
      }
    };

    const response = await axios.post(
      'https://a.klaviyo.com/api/track',
      payload,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    return {
      status: response.status,
      message: 'Triggered ContentUpdateTrigger event in Klaviyo'
    };
  } catch (error) {
    console.error('Klaviyo ContentUpdateTrigger error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(`Failed to trigger ContentUpdateTrigger: ${error.message}`);
  }
};