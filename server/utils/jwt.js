const jwt = require('jsonwebtoken');
const ApiError = require('./ApiError');

const COOKIE_NAME = process.env.JWT_COOKIE_NAME || 'quizify_token';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new ApiError(500, 'JWT_SECRET is not configured on the server');
  }
  return secret;
};

const signToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite = process.env.COOKIE_SAME_SITE || (isProd ? 'lax' : 'lax');
  const secure =
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === 'true'
      : isProd || sameSite === 'none';

  return {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  };
};

module.exports = {
  COOKIE_NAME,
  signToken,
  verifyToken,
  getCookieOptions,
};
