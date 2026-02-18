require('dotenv').config();
console.log('FRONTEND_URL from .env:', process.env.FRONTEND_URL);
console.log('All env vars:', {
  FRONTEND_URL: process.env.FRONTEND_URL,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_SERVICE: process.env.EMAIL_SERVICE
});
