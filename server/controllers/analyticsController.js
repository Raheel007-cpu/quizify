const asyncHandler = require('../utils/asyncHandler');
const analyticsService = require('../services/analyticsService');

const getOverview = asyncHandler(async (req, res) => {
  const overview = await analyticsService.getUserOverview(req.user.id);
  res.status(200).json({ success: true, data: overview });
});

const getPerformance = asyncHandler(async (req, res) => {
  const performance = await analyticsService.getUserPerformance(req.user.id);
  res.status(200).json({ success: true, data: performance });
});

const getSubjectsAnalytics = asyncHandler(async (req, res) => {
  const subjects = await analyticsService.getUserSubjectAnalytics(req.user.id);
  res.status(200).json({ success: true, data: { subjects } });
});

const getAdminAnalytics = asyncHandler(async (_req, res) => {
  const data = await analyticsService.getAdminAnalytics();
  res.status(200).json({ success: true, data });
});

module.exports = {
  getOverview,
  getPerformance,
  getSubjectsAnalytics,
  getAdminAnalytics,
};
