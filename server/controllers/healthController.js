const asyncHandler = require('../utils/asyncHandler');
const healthService = require('../services/healthService');

const getHealth = asyncHandler(async (_req, res) => {
  const health = await healthService.checkHealth();
  const statusCode = health.database.connected ? 200 : 503;

  res.status(statusCode).json({
    success: health.database.connected,
    message: health.database.connected
      ? 'API and PostgreSQL database are healthy'
      : 'API is running, but PostgreSQL database connection failed',
    data: health,
  });
});

module.exports = {
  getHealth,
};
