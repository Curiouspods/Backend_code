const crypto = require('crypto');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Should be 32-byte
const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'utf-8'); // Convert properly
console.log("Key Length After Buffer Conversion:", keyBuffer.length);

const IV_LENGTH = 16; // AES block size

exports.encryptData = (data) => {
    if (!data) return null;
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};

exports.decryptData = (encryptedData) => {
    if (!encryptedData) return null;
    let parts = encryptedData.split(':');
    let iv = Buffer.from(parts[0], 'hex');
    let encryptedText = Buffer.from(parts[1], 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
