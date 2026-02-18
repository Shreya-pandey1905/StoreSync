const nodemailer = require('nodemailer');
require('dotenv').config();

function createTransport() {
  const service = process.env.EMAIL_SERVICE;
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : undefined;
  const secure = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : undefined;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass || (!service && !host)) {
    throw new Error('Email transport is not configured. Set EMAIL_SERVICE or EMAIL_HOST and credentials.');
  }

  const transportOptions = service
    ? { service, auth: { user, pass } }
    : { host, port: port || 587, secure: secure ?? false, auth: { user, pass } };

  return nodemailer.createTransport(transportOptions);
}

async function sendTestEmail() {
  const transporter = createTransport();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: 'Test Email from Node.js',
    text: 'This is a test email to verify your setup.'
  });
  console.log('Test email sent:', info.response || info.messageId);
}

sendTestEmail().catch(err => {
  console.error('Error:', err);
});
