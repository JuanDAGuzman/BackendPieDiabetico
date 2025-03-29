require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'default_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
};