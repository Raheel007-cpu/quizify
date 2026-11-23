const prisma = require('../utils/prisma');

const checkHealth = async () => {
  const startTime = Date.now();
  let dbConnected = false;
  let dbError = null;
  let dbLatencyMs = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
    dbLatencyMs = Date.now() - startTime;
  } catch (error) {
    dbConnected = false;
    dbError = error.message;
  }

  return {
    service: 'quizify-api',
    status: dbConnected ? 'healthy' : 'degraded',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      provider: 'postgresql',
      connected: dbConnected,
      latencyMs: dbLatencyMs,
      ...(dbError && process.env.NODE_ENV !== 'production' ? { error: dbError } : {}),
    },
  };
};

module.exports = {
  checkHealth,
};
