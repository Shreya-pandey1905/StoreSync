const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

function isEmailConfigured() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  return Boolean(user && pass && (process.env.EMAIL_SERVICE || process.env.EMAIL_HOST));
}

function logOtpToConsole(label, to, otp, expiresMinutes) {
  console.log('\n┌──────────────────────────────────────────────────────────');
  console.log(`│ ${label}`);
  console.log(`│ To: ${to}`);
  console.log(`│ OTP: ${otp}   (expires in ${expiresMinutes} min)`);
  console.log('└──────────────────────────────────────────────────────────\n');
}

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
    subject: 'Password Reset Request - StoreSync',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color:rgb(23, 40, 77); margin: 0;">StoreSync</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Inventory Management System</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
          
          <p style="color: #4b5563; line-height: 1.6;">
            Hello ${name},
          </p>
          
          <p style="color: #4b5563; line-height: 1.6;">
            We received a request to reset your password for your StoreSync account. 
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
          <p>This email was sent from StoreSync Inventory Management System</p>
        </div>
      </div>
    `,
    text: `
      Password Reset Request - StoreSync
      
      Hello ${name},
      
      We received a request to reset your password for your StoreSync account.
      If you made this request, visit the following link to reset your password:
      
      ${resetUrl}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request a password reset, you can safely ignore this email.
      Your password will remain unchanged.
      
      ---
      StoreSync Inventory Management System
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
    subject: 'Verify Your Email - StoreSync',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">StoreSync</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Inventory Management System</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email Address</h2>
          
          <p style="color: #4b5563; line-height: 1.6;">
            Hello ${name},
          </p>
          
          <p style="color: #4b5563; line-height: 1.6;">
            Welcome to StoreSync! Please verify your email address to complete your registration 
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
            If you didn't create an account with StoreSync, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
          <p>This email was sent from StoreSync Inventory Management System</p>
        </div>
      </div>
    `,
    text: `
      Verify Your Email Address - StoreSync
      
      Hello ${name},
      
      Welcome to StoreSync! Please verify your email address to complete your registration.
      
      Visit the following link to verify your email:
      
      ${verificationUrl}
      
      This link will expire in 24 hours for security reasons.
      
      If you didn't create an account with StoreSync, you can safely ignore this email.
      
      ---
      StoreSync Inventory Management System
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

/**
 * Sends signup OTP. If SMTP is not set, requires LOG_OTP_TO_CONSOLE=true (logs OTP to server console).
 * Set LOG_OTP_TO_CONSOLE=true in backend/.env for local dev without mail.
 */
async function deliverSignupOtp({ to, name, otp, expiresMinutes = 15 }) {
  const logConsole = process.env.LOG_OTP_TO_CONSOLE === 'true';
  if (logConsole) {
    logOtpToConsole('SIGNUP OTP', to, otp, expiresMinutes);
  }
  if (!isEmailConfigured()) {
    if (logConsole) {
      console.warn('[email] SMTP not configured; OTP was printed above (LOG_OTP_TO_CONSOLE).');
      return;
    }
    throw new Error(
      'Email is not configured. Add EMAIL_USER, EMAIL_PASS, and EMAIL_SERVICE (e.g. Gmail) or EMAIL_HOST to backend/.env. For local testing without SMTP, set LOG_OTP_TO_CONSOLE=true.'
    );
  }
  await sendSignupOtpEmail({ to, name, otp, expiresMinutes });
}

/**
 * Sends password-reset OTP; same rules as deliverSignupOtp.
 */
async function deliverPasswordResetOtp({ to, name, otp, expiresMinutes = 15 }) {
  const logConsole = process.env.LOG_OTP_TO_CONSOLE === 'true';
  if (logConsole) {
    logOtpToConsole('PASSWORD RESET OTP', to, otp, expiresMinutes);
  }
  if (!isEmailConfigured()) {
    if (logConsole) {
      console.warn('[email] SMTP not configured; OTP was printed above (LOG_OTP_TO_CONSOLE).');
      return;
    }
    throw new Error(
      'Email is not configured. Add EMAIL_USER, EMAIL_PASS, and EMAIL_SERVICE or EMAIL_HOST to backend/.env. For local testing, set LOG_OTP_TO_CONSOLE=true.'
    );
  }
  await sendPasswordResetOtpEmail({ to, name, otp, expiresMinutes });
}

async function sendSignupOtpEmail({ to, name, otp, expiresMinutes = 15 }) {
  const transporter = createTransport();
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: 'Your verification code - StoreSync',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1f2937;">Verify your email</h2>
        <p style="color: #4b5563;">Hello ${name},</p>
        <p style="color: #4b5563;">Use this code to verify your account:</p>
        <p style="font-size: 28px; letter-spacing: 8px; font-weight: bold; color: #2563eb;">${otp}</p>
        <p style="color: #6b7280; font-size: 14px;">This code expires in ${expiresMinutes} minutes. Do not share it with anyone.</p>
      </div>
    `,
    text: `Hello ${name},\n\nYour verification code is: ${otp}\n\nExpires in ${expiresMinutes} minutes.`
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Signup OTP email sent:', info.response || info.messageId);
    return info;
  } catch (err) {
    console.error('[email] sendSignupOtpEmail failed:', err.message);
    throw err;
  }
}

async function sendPasswordResetOtpEmail({ to, name, otp, expiresMinutes = 15 }) {
  const transporter = createTransport();
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: 'Your password reset code - StoreSync',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1f2937;">Password reset</h2>
        <p style="color: #4b5563;">Hello ${name},</p>
        <p style="color: #4b5563;">Use this code to continue resetting your password:</p>
        <p style="font-size: 28px; letter-spacing: 8px; font-weight: bold; color: #2563eb;">${otp}</p>
        <p style="color: #6b7280; font-size: 14px;">This code expires in ${expiresMinutes} minutes. If you did not request this, ignore this email.</p>
      </div>
    `,
    text: `Hello ${name},\n\nYour password reset code is: ${otp}\n\nExpires in ${expiresMinutes} minutes.`
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset OTP email sent:', info.response || info.messageId);
    return info;
  } catch (err) {
    console.error('[email] sendPasswordResetOtpEmail failed:', err.message);
    throw err;
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendSignupOtpEmail,
  sendPasswordResetOtpEmail,
  deliverSignupOtp,
  deliverPasswordResetOtp,
  isEmailConfigured
};
