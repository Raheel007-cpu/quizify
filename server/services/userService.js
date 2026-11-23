const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const { SAFE_USER_SELECT } = require('../middleware/authMiddleware');

const SALT_ROUNDS = 12;

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: SAFE_USER_SELECT,
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
};

const updateProfile = async (
  userId,
  { name, email, currentPassword, newPassword }
) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...SAFE_USER_SELECT,
      passwordHash: true,
    },
  });

  if (!existingUser) {
    throw new ApiError(404, 'User not found');
  }

  const updates = {};

  if (name !== undefined) {
    updates.name = name;
  }

  if (email !== undefined && email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (emailTaken) {
      throw new ApiError(409, 'Email is already in use by another account');
    }

    updates.email = email;
  }

  if (newPassword) {
    const isCurrentValid = await bcrypt.compare(
      currentPassword,
      existingUser.passwordHash
    );

    if (!isCurrentValid) {
      throw new ApiError(400, 'Current password is incorrect');
    }

    updates.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  }

  if (Object.keys(updates).length === 0) {
    const { passwordHash: _passwordHash, ...user } = existingUser;
    return user;
  }

  return prisma.user.update({
    where: { id: userId },
    data: updates,
    select: SAFE_USER_SELECT,
  });
};

const listUsers = async () => {
  return prisma.user.findMany({
    select: SAFE_USER_SELECT,
    orderBy: { createdAt: 'desc' },
  });
};

module.exports = {
  getProfile,
  updateProfile,
  listUsers,
};
