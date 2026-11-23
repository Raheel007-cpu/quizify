const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const { COOKIE_NAME, getCookieOptions } = require('../utils/jwt');

const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);

  res.cookie(COOKIE_NAME, token, getCookieOptions());
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user },
  });
});

const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);

  res.cookie(COOKIE_NAME, token, getCookieOptions());
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { user },
  });
});

const logout = asyncHandler(async (_req, res) => {
  const { maxAge: _maxAge, ...clearOptions } = getCookieOptions();
  res.clearCookie(COOKIE_NAME, clearOptions);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
};
