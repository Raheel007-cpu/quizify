const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');
const { SAFE_USER_SELECT } = require('../middleware/authMiddleware');

const SALT_ROUNDS = 12;

const register = async ({ name, email, password }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'STUDENT',
    },
    select: SAFE_USER_SELECT,
  });

  const token = signToken(user);

  return { user, token };
};

const login = async ({ email, password }) => {
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
    select: {
      ...SAFE_USER_SELECT,
      passwordHash: true,
    },
  });

  if (!userWithPassword) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    userWithPassword.passwordHash
  );

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const { passwordHash: _passwordHash, ...user } = userWithPassword;
  const token = signToken(user);

  return { user, token };
};

module.exports = {
  register,
  login,
};
