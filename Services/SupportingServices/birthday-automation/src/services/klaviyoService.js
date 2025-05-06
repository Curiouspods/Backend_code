const axios = require('axios');
require('dotenv').config();

class KlaviyoService {
  constructor() {
    this.apiKey = process.env.KLAVIYO_API_KEY;
    this.listId = process.env.KLAVIYO_LIST_ID;
    this.baseUrl = 'https://a.klaviyo.com/api';
  }

  /**
   * Send birthday email by ensuring user exists in Klaviyo and triggering an event.
   */
  async sendBirthdayEmail(user) {
    try {
      // Ensure the user exists in Klaviyo before triggering the event
      const profileId = await this.addUserToList(user);
      
      if (!profileId) {
        console.warn(`Skipping email for ${user.email} as they already exist in Klaviyo.`);
        return false;
      }

      // Trigger the birthday event
      await this.triggerBirthdayEvent(user);
      return true;
    } catch (error) {
      console.error('Error sending birthday email via Klaviyo:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Check if user exists in Klaviyo. If not, create them.
   * If they exist, update their details.
   */
  async addUserToList(user) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
        'revision': '2023-10-15'
      };

      console.log(`Checking if user ${user.email} exists in Klaviyo...`);

      const searchResponse = await axios.get(
        `${this.baseUrl}/profiles/?filter=equals(email,"${encodeURIComponent(user.email)}")`,
        { headers }
      );
      let profileId = null;
      if (searchResponse.data.data.length > 0) {
        profileId = searchResponse.data.data[0].id;
        console.log(`User ${user.email} already exists in Klaviyo with ID: ${profileId}`);
      }

      // ✅ Step 2: If user exists, update properties instead of adding
      if (profileId) {
        const updatePayload = {
          data: {
            type: 'profile',
            id: profileId,
            attributes: {
              properties: {
                date_of_birth: this.formatDate(user.dateOfBirth),
                is_active: user.isActive
              }
            }
          }
        };

        await axios.patch(`${this.baseUrl}/profiles/${profileId}/`, updatePayload, { headers });
        console.log(`User ${user.email} profile updated successfully.`);
      } else {
        // ✅ Step 3: If user doesn't exist, create a new profile
        const createPayload = {
          data: {
            type: 'profile',
            attributes: {
              email: user.email,
              first_name: user.firstName,
              last_name: user.lastName,
              properties: {
                date_of_birth: this.formatDate(user.dateOfBirth),
                is_active: user.isActive
              }
            }
          }
        };

        console.log(`Adding new user ${user.email} to Klaviyo...`);
        const profileResponse = await axios.post(`${this.baseUrl}/profiles/`, createPayload, { headers });

        if (profileResponse.data && profileResponse.data.data) {
          profileId = profileResponse.data.data.id;
          await axios.post(
            `${this.baseUrl}/lists/${this.listId}/relationships/profiles/`,
            { data: [{ type: 'profile', id: profileId }] },
            { headers }
          );

          console.log(`User ${user.email} added successfully to Klaviyo list.`);
        }
      }

      return profileId;
    } catch (error) {
      console.error('Error handling user in Klaviyo:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Trigger the birthday event in Klaviyo for the user.
   */
  async triggerBirthdayEvent(user) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
        'revision': '2023-10-15'
      };
  
      // Calculate age correctly
      const birthYear = new Date(user.dateOfBirth).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
  
      const payload = {
        data: {
          type: "event",
          attributes: {
            metric: {
              data: {
                type: "metric",
                attributes: {
                  name: "Birthday Today"
                }
              }
            },
            profile: {
              data: {
                type: "profile",
                attributes: { 
                  email: user.email 
                }
              }
            },
            properties: {
              age: age,
              is_active: user.isActive
            },
            time: new Date().toISOString()
          }
        }
      };
  
      console.log(`Triggering birthday event for ${user.email}...`, JSON.stringify(payload));
      const response = await axios.post(`${this.baseUrl}/events/`, payload, { headers });
      console.log(`Response:`, response.status, response.statusText);
  
      console.log(`Birthday event triggered successfully for ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      throw error;
    }
  }

  /**
   * Utility function to format date as YYYY-MM-DD
   */
  formatDate(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    return date.toISOString().split('T')[0];
  }
}

module.exports = new KlaviyoService();