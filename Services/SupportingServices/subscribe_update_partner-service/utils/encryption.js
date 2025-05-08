const crypto = require('crypto');

// Replace with your own secure key & IV
const algorithm = 'aes-256-cbc';
const secretKey = crypto.randomBytes(32); // Or store in .env
const iv = crypto.randomBytes(16);        // Initialization vector

exports.encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    iv: iv.toString('hex'),
    content: encrypted
  };
};

exports.decrypt = (hash) => {
  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(hash.iv, 'hex')
  );
  let decrypted = decipher.update(hash.content, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

exports.hashEmail = (email) => {
    return crypto.createHash('sha256').update(email).digest('hex');
  };