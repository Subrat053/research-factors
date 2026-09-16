import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { config } from './index.js';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: config.NODE_ENV === 'development'
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'warn' }
        ]
      : ['error']
  });
};

const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (config.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

if (config.NODE_ENV === 'development') {
  prisma.$on?.('query', (e) => {
    logger.debug(`Prisma Query: ${e.query} [params: ${e.params}] duration: ${e.duration}ms`);
  });
}
