// File: src/services/excel.service.js
const xlsx = require('xlsx');

/**
 * Process Excel file and extract user data
 * @param {string} filePath - Path to the uploaded Excel file
 * @returns {Array} - Array of user objects with firstname, lastname, email, etc.
 */
exports.processExcelFile = (filePath) => {
  try {
    // Read the Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const users = xlsx.utils.sheet_to_json(worksheet);
    
    console.log(`Raw data from Excel:`, users.slice(0, 2)); // Log first 2 users for debugging
    
    // Validate each user has required fields
    const validUsers = users.filter(user => {
      const hasEmail = user.email || user.Email;
      const hasFirstName = user.firstname || user.firstName || user.first_name || 
                          user.Firstname || user.FirstName || user.First_name;
                          
      return hasEmail && hasFirstName;
    });
    
    // Normalize field names
    return validUsers.map(user => {
      const normalizedUser = {
        firstName: user.firstname || user.firstName || user.first_name || 
                  user.Firstname || user.FirstName || user.First_name || '',
        lastName: user.lastname || user.lastName || user.last_name || 
                 user.Lastname || user.LastName || user.Last_name || '',
        email: user.email || user.Email || ''
      };
      
      // Add any additional fields
      Object.keys(user).forEach(key => {
        if (!['firstname', 'firstName', 'first_name', 'Firstname', 'FirstName', 'First_name',
               'lastname', 'lastName', 'last_name', 'Lastname', 'LastName', 'Last_name',
               'email', 'Email'].includes(key)) {
          normalizedUser[key] = user[key];
        }
      });
      
      return normalizedUser;
    });
  } catch (error) {
    console.error(`Excel processing error:`, error);
    throw new Error(`Excel processing error: ${error.message}`);
  }
};