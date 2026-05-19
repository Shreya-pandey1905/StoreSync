const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const OTP_LENGTH = 6;
const OTP_SALT_ROUNDS = 10;

function generateOtpDigits() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(OTP_LENGTH, '0');
}

function normalizeOtpInput(input) {
  if (input == null) return '';
  const digits = String(input).replace(/\D/g, '');
  return digits.slice(-OTP_LENGTH).padStart(OTP_LENGTH, '0');
}

async function hashOtp(plain) {
  const normalized = normalizeOtpInput(plain);
  return bcrypt.hash(normalized, OTP_SALT_ROUNDS);
}

async function compareOtp(plain, hash) {
  if (!plain || !hash) return false;
  const normalized = normalizeOtpInput(plain);
  if (normalized.length !== OTP_LENGTH) return false;
  return bcrypt.compare(normalized, hash);
}

function otpExpiryDate(minutes) {
  const m = Math.max(1, Math.min(60, Number(minutes) || 15));
  return new Date(Date.now() + m * 60 * 1000);
}

module.exports = {
  generateOtpDigits,
  normalizeOtpInput,
  hashOtp,
  compareOtp,
  otpExpiryDate,
  OTP_LENGTH
};
