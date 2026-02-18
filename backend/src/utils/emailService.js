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

async function sendPasswordResetEmail({ to, name, token, baseUrl }) {
  const transporter = createTransport();
  
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: 'Password Reset Request - SmartKirana',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color:rgb(23, 40, 77); margin: 0;">SmartKirana</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Inventory Management System</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
          
          <p style="color: #4b5563; line-height: 1.6;">
            Hello ${name},
          </p>
          
          <p style="color: #4b5563; line-height: 1.6;">
            We received a request to reset your password for your SmartKirana account. 
            If you made this request, click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            This link will expire in 1 hour for security reasons.
          </p>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            If you didn't request a password reset, you can safely ignore this email. 
            Your password will remain unchanged.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
          <p>This email was sent from SmartKirana Inventory Management System</p>
        </div>
      </div>
    `,
    text: `
      Password Reset Request - SmartKirana
      
      Hello ${name},
      
      We received a request to reset your password for your SmartKirana account.
      If you made this request, visit the following link to reset your password:
      
      ${resetUrl}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request a password reset, you can safely ignore this email.
      Your password will remain unchanged.
      
      ---
      SmartKirana Inventory Management System
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.response || info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}

async function sendVerificationEmail({ to, name, token, baseUrl }) {
  const transporter = createTransport();
  
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: 'Verify Your Email - SmartKirana',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">SmartKirana</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Inventory Management System</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email Address</h2>
          
          <p style="color: #4b5563; line-height: 1.6;">
            Hello ${name},
          </p>
          
          <p style="color: #4b5563; line-height: 1.6;">
            Welcome to SmartKirana! Please verify your email address to complete your registration 
            and start using your account.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            This link will expire in 24 hours for security reasons.
          </p>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            If you didn't create an account with SmartKirana, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
          <p>This email was sent from SmartKirana Inventory Management System</p>
        </div>
      </div>
    `,
    text: `
      Verify Your Email Address - SmartKirana
      
      Hello ${name},
      
      Welcome to SmartKirana! Please verify your email address to complete your registration.
      
      Visit the following link to verify your email:
      
      ${verificationUrl}
      
      This link will expire in 24 hours for security reasons.
      
      If you didn't create an account with SmartKirana, you can safely ignore this email.
      
      ---
      SmartKirana Inventory Management System
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.response || info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail
};
