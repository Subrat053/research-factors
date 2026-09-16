import { prisma } from '../config/db.js';

async function main() {
  const updatedMedia = await prisma.$executeRawUnsafe(
    "UPDATE media SET public_url = REPLACE(public_url, 'http://localhost:5000/uploads', 'http://localhost:5005/uploads') WHERE public_url LIKE '%localhost:5000/uploads%'"
  );
  console.log('Updated media rows:', updatedMedia);

  const updatedArticles = await prisma.$executeRawUnsafe(
    "UPDATE articles SET cover_image_url = REPLACE(cover_image_url, 'http://localhost:5000/uploads', 'http://localhost:5005/uploads') WHERE cover_image_url LIKE '%localhost:5000/uploads%'"
  );
  console.log('Updated articles rows:', updatedArticles);

  const updatedBlocks = await prisma.$executeRawUnsafe(
    "UPDATE article_blocks SET content = REPLACE(content::text, 'http://localhost:5000/uploads', 'http://localhost:5005/uploads')::jsonb WHERE content::text LIKE '%localhost:5000/uploads%'"
  );
  console.log('Updated blocks rows:', updatedBlocks);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
