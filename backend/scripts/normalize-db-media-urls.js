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
  const loopbackUploadsPattern = 'https?://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?(/rf)?/uploads';

  // 1. Normalize media table
  const mediaUpdated = await prisma.$executeRawUnsafe(`
    UPDATE media 
    SET public_url = regexp_replace(public_url, '^${loopbackUploadsPattern}', '${targetStorageUrl}')
    WHERE public_url ~ '^${loopbackUploadsPattern}';
  `);
  logger.info(`✅ Updated ${mediaUpdated} records in "media" table.`);

  // 2. Normalize articles table (cover_image_url)
  const articlesUpdated = await prisma.$executeRawUnsafe(`
    UPDATE articles 
    SET cover_image_url = regexp_replace(cover_image_url, '^${loopbackUploadsPattern}', '${targetStorageUrl}')
    WHERE cover_image_url ~ '^${loopbackUploadsPattern}';
  `);
  logger.info(`✅ Updated ${articlesUpdated} records in "articles" table.`);

  const sponsorLogosUpdated = await prisma.$executeRawUnsafe(`
    UPDATE articles
    SET sponsor_logo_url = regexp_replace(sponsor_logo_url, '^${loopbackUploadsPattern}', '${targetStorageUrl}')
    WHERE sponsor_logo_url ~ '^${loopbackUploadsPattern}';
  `);
  logger.info(`✅ Updated ${sponsorLogosUpdated} sponsor logo records in "articles" table.`);

  const categoriesUpdated = await prisma.$executeRawUnsafe(`
    UPDATE categories
    SET image_url = regexp_replace(image_url, '^${loopbackUploadsPattern}', '${targetStorageUrl}')
    WHERE image_url ~ '^${loopbackUploadsPattern}';
  `);
  logger.info(`✅ Updated ${categoriesUpdated} records in "categories" table.`);

  const usersUpdated = await prisma.$executeRawUnsafe(`
    UPDATE users
    SET avatar_url = regexp_replace(avatar_url, '^${loopbackUploadsPattern}', '${targetStorageUrl}')
    WHERE avatar_url ~ '^${loopbackUploadsPattern}';
  `);
  logger.info(`✅ Updated ${usersUpdated} records in "users" table.`);

  const seoUpdated = await prisma.$executeRawUnsafe(`
    UPDATE seo_metadata
    SET
      custom_og_image = CASE WHEN custom_og_image ~ '^${loopbackUploadsPattern}' THEN regexp_replace(custom_og_image, '^${loopbackUploadsPattern}', '${targetStorageUrl}') ELSE custom_og_image END,
      custom_twitter_image = CASE WHEN custom_twitter_image ~ '^${loopbackUploadsPattern}' THEN regexp_replace(custom_twitter_image, '^${loopbackUploadsPattern}', '${targetStorageUrl}') ELSE custom_twitter_image END,
      generated_og_image = CASE WHEN generated_og_image ~ '^${loopbackUploadsPattern}' THEN regexp_replace(generated_og_image, '^${loopbackUploadsPattern}', '${targetStorageUrl}') ELSE generated_og_image END
    WHERE custom_og_image ~ '^${loopbackUploadsPattern}'
       OR custom_twitter_image ~ '^${loopbackUploadsPattern}'
       OR generated_og_image ~ '^${loopbackUploadsPattern}';
  `);
  logger.info(`✅ Updated ${seoUpdated} records in "seo_metadata" table.`);

  // 3. Normalize article_blocks table (image block URLs inside JSONB content)
  const blocksUpdated = await prisma.$executeRawUnsafe(`
    UPDATE article_blocks 
    SET content = regexp_replace(content::text, '${loopbackUploadsPattern}', '${targetStorageUrl}', 'g')::jsonb
    WHERE content::text ~ '${loopbackUploadsPattern}';
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
