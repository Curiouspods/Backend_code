// redisClient.js
const redis = require('redis');
let client;

const connectClient = async () => {
  client = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: 6379
    },
    // password: process.env.REDIS_CLIENT_PASSWORD, // Uncomment if needed
  });

  client.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  client.on('ready', () => {
    console.log('Redis client connected');
  });

  await client.connect();
};

const getAsync = async (key) => {
  if (!client) throw new Error('Redis client not initialized');
  return client.get(key);
};

const setAsync = async (key, value, seconds) => {
  if (!client) throw new Error('Redis client not initialized');
  return client.set(key, value, { EX: seconds });
};

const delAsync = async (key) => {
  if (!client) throw new Error('Redis client not initialized');
  return client.del(key);
};

module.exports = {
  connectClient,
  getAsync,
  setAsync,
  delAsync,
};
