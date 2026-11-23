const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { COOKIE_NAME, verifyToken } = require('../utils/jwt');

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

const extractToken = (req) => {
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return null;
};

const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw new ApiError(401, 'Authentication required. Please log in.');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw new ApiError(401, 'Session expired or invalid. Please log in again.');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    select: SAFE_USER_SELECT,
  });

  if (!user) {
    throw new ApiError(401, 'Account associated with this session no longer exists.');
  }

  req.user = user;
  next();
});

const optionalAuthenticate = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return next();
    }
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: SAFE_USER_SELECT,
    });
    if (user) {
      req.user = user;
    }
  } catch {
    // Ignore invalid/expired token for optional auth routes
  }
  return next();
};

const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required.'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(
      new ApiError(403, 'You do not have permission to perform this action.')
    );
  }

  return next();
};

module.exports = {
  SAFE_USER_SELECT,
  authenticate,
  optionalAuthenticate,
  authorize,
};
