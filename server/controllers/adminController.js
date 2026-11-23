const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/adminService');

const getOverview = asyncHandler(async (_req, res) => {
  const overview = await adminService.getAdminOverview();
  res.status(200).json({ success: true, data: overview });
});

const listAttempts = asyncHandler(async (req, res) => {
  const result = await adminService.listAllAttempts(req.query);
  res.status(200).json({ success: true, data: result });
});

module.exports = {
  getOverview,
  listAttempts,
};
