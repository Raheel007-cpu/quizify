require('dotenv/config');

const app = require('./app');
const prisma = require('./utils/prisma');

const PORT = Number(process.env.PORT) || 5000;
let server;

const startServer = async () => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('Connected to PostgreSQL database.');
  } catch (error) {
    console.error('Failed to connect to PostgreSQL database:', error.message);
  }

  server = app.listen(PORT, () => {
    console.log(
      `Quizify server running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`
    );
  });
};

startServer();

const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
