const asyncHandler = require('../utils/asyncHandler');
const parseId = require('../utils/parseId');
const userService = require('../services/userService');

const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  res.status(200).json({
    success: true,
    data: { user },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listUsers({ search: req.query.search });
  res.status(200).json({
    success: true,
    data: { users },
  });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const targetUserId = parseId(req.params.id, 'user ID');
  const user = await userService.updateUserRole(
    targetUserId,
    req.body.role,
    req.user.id
  );
  res.status(200).json({
    success: true,
    message: 'User role updated successfully',
    data: { user },
  });
});

module.exports = {
  getProfile,
  updateProfile,
  listUsers,
  updateUserRole,
};
