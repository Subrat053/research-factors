import { app } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { prisma } from './config/db.js';

const server = app.listen(config.PORT, () => {
  logger.info(`🚀 Research Factors Backend API listening on port ${config.PORT} [${config.NODE_ENV}]`);
  logger.info(`📡 API URL: ${config.API_URL}`);
  logger.info(`📦 Storage Provider: ${config.STORAGE_PROVIDER} (${config.LOCAL_STORAGE_PUBLIC_URL})`);
});

const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Database connection pool closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during graceful shutdown:', err);
      process.exit(1);
    }
  });

  // Force close after 10 seconds if hanging
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
