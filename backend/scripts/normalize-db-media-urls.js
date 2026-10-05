import { prisma } from '../src/config/db.js';
import { config } from '../src/config/index.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  logger.info('=====================================================');
  logger.info('🔄 Normalizing Database Media URLs to Active Environment');
  logger.info(`📡 Current API_URL: ${config.API_URL}`);
  logger.info(`📦 Storage Base:    ${config.LOCAL_STORAGE_PUBLIC_URL}`);
  logger.info('=====================================================');

  const targetStorageUrl = config.LOCAL_STORAGE_PUBLIC_URL.replace(/\/+$/, '');

  // 1. Normalize media table
  const mediaUpdated = await prisma.$executeRawUnsafe(`
    UPDATE media 
    SET public_url = regexp_replace(public_url, '^https?://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?/uploads', '${targetStorageUrl}')
    WHERE public_url ~ '^https?://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?/uploads';
  `);
  logger.info(`✅ Updated ${mediaUpdated} records in "media" table.`);

  // 2. Normalize articles table (cover_image_url)
  const articlesUpdated = await prisma.$executeRawUnsafe(`
    UPDATE articles 
    SET cover_image_url = regexp_replace(cover_image_url, '^https?://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?/uploads', '${targetStorageUrl}')
    WHERE cover_image_url ~ '^https?://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?/uploads';
  `);
  logger.info(`✅ Updated ${articlesUpdated} records in "articles" table.`);

  // 3. Normalize article_blocks table (image block URLs inside JSONB content)
  const blocksUpdated = await prisma.$executeRawUnsafe(`
    UPDATE article_blocks 
    SET content = regexp_replace(content::text, 'https?://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?/uploads', '${targetStorageUrl}', 'g')::jsonb
    WHERE content::text ~ 'https?://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?/uploads';
  `);
  logger.info(`✅ Updated ${blocksUpdated} records in "article_blocks" table.`);

  logger.info('🎉 Media URL normalization completed successfully.');
}

main()
  .catch((err) => {
    logger.error('❌ Failed to normalize media URLs:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
