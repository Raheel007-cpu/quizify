const asyncHandler = require('../utils/asyncHandler');
const leaderboardService = require('../services/leaderboardService');

const getLeaderboard = asyncHandler(async (req, res) => {
  const data = await leaderboardService.getLeaderboard(
    req.query,
    req.user?.id || null
  );
  res.status(200).json({ success: true, data });
});

module.exports = {
  getLeaderboard,
};
