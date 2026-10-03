import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedTataNexonArticle() {
  console.log('🚗 Starting Tata Nexon Powertrain Comparison Article Ingestion...');

  // 1. Read JSON file
  const jsonPath = path.resolve(__dirname, '../src/data/articles/tata-nexon-ev-petrol-diesel-cng-2026.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Article JSON file not found at: ${jsonPath}`);
  }

  const articleData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`📖 Successfully loaded JSON for: "${articleData.title}"`);

  // 2. Ensure Category: Automotive
  const category = await prisma.category.upsert({
    where: { slug: articleData.categorySlug || 'automotive' },
    update: {
      name: 'Automotive',
      description: 'Vehicle engineering benchmarks, powertrain thermodynamics, battery degradation telemetry, and autonomous driving safety systems.',
      isActive: true,
      showInFooter: true,
      seoTitle: 'Automotive Research, Benchmarks & EV Engineering | Research Factors',
      seoDescription: 'Empirical vehicle performance evaluations, EV battery diagnostics, powertrain lifecycle cost studies, and road safety benchmarks.'
    },
    create: {
      name: 'Automotive',
      slug: 'automotive',
      description: 'Vehicle engineering benchmarks, powertrain thermodynamics, battery degradation telemetry, and autonomous driving safety systems.',
      isActive: true,
      showInFooter: true,
      seoTitle: 'Automotive Research, Benchmarks & EV Engineering | Research Factors',
      seoDescription: 'Empirical vehicle performance evaluations, EV battery diagnostics, powertrain lifecycle cost studies, and road safety benchmarks.'
    }
  });
  console.log(`✅ Category '${category.name}' ready (${category.id})`);

  // 3. Resolve Author & Editor
  let author = await prisma.user.findFirst({
    where: {
      email: 'author@researchfactors.com',
      status: 'ACTIVE'
    }
  });
  if (!author) {
    author = await prisma.user.findFirst({ where: { status: 'ACTIVE' } });
  }
  if (!author) {
    throw new Error('No active author found in database!');
  }
  console.log(`✅ Author: ${author.firstName} ${author.lastName} (${author.email})`);

  let editor = await prisma.user.findFirst({
    where: {
      email: 'editor@researchfactors.com',
      status: 'ACTIVE'
    }
  });
  if (!editor) {
    editor = author;
  }

  // 4. Upsert Tags
  const tagMap = new Map();
  for (const tag of articleData.tags) {
    const record = await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name },
      create: { name: tag.name, slug: tag.slug }
    });
    tagMap.set(tag.slug, record.id);
  }
  console.log(`✅ ${tagMap.size} Tags verified/upserted.`);

  // 5. Upsert Article
  const article = await prisma.article.upsert({
    where: { slug: articleData.slug },
    update: {
      title: articleData.title,
      subtitle: articleData.subtitle,
      excerpt: articleData.excerpt,
      type: articleData.type,
      status: articleData.status || 'PUBLISHED',
      readingTimeMin: articleData.readingTimeMin || 8,
      coverImageUrl: articleData.coverImageUrl,
      coverImageAlt: articleData.coverImageAlt,
      isFeatured: articleData.isFeatured ?? true,
      categoryId: category.id,
      authorId: author.id,
      createdById: author.id,
      publishedById: editor.id,
      publishedAt: new Date('2026-10-03T10:00:00.000Z'),
      seoTitle: articleData.seoTitle,
      seoDescription: articleData.seoDescription,
      canonicalUrl: articleData.canonicalUrl
    },
    create: {
      title: articleData.title,
      slug: articleData.slug,
      subtitle: articleData.subtitle,
      excerpt: articleData.excerpt,
      type: articleData.type,
      status: articleData.status || 'PUBLISHED',
      readingTimeMin: articleData.readingTimeMin || 8,
      viewCount: 420,
      coverImageUrl: articleData.coverImageUrl,
      coverImageAlt: articleData.coverImageAlt,
      isFeatured: articleData.isFeatured ?? true,
      categoryId: category.id,
      authorId: author.id,
      createdById: author.id,
      publishedById: editor.id,
      publishedAt: new Date('2026-10-03T10:00:00.000Z'),
      seoTitle: articleData.seoTitle,
      seoDescription: articleData.seoDescription,
      canonicalUrl: articleData.canonicalUrl
    }
  });
  console.log(`✅ Article record upserted: ${article.title} (${article.id})`);

  // 6. Seed Blocks
  await prisma.articleBlock.deleteMany({ where: { articleId: article.id } });
  const blocksToInsert = articleData.blocks.map((block, idx) => ({
    articleId: article.id,
    blockType: block.blockType,
    position: block.position ?? idx,
    content: block.content,
    metadata: block.metadata || null
  }));

  await prisma.articleBlock.createMany({
    data: blocksToInsert
  });
  console.log(`✅ ${blocksToInsert.length} Article Blocks inserted successfully.`);

  // 7. Seed Tags Relation
  await prisma.articleTag.deleteMany({ where: { articleId: article.id } });
  for (const tag of articleData.tags) {
    const tagId = tagMap.get(tag.slug);
    if (tagId) {
      await prisma.articleTag.create({
        data: {
          articleId: article.id,
          tagId: tagId
        }
      });
    }
  }
  console.log(`✅ Linked ${articleData.tags.length} Tags to Article.`);

  // 8. Record Slug History
  await prisma.articleSlugHistory.upsert({
    where: { slug: article.slug },
    update: {},
    create: {
      slug: article.slug,
      articleId: article.id
    }
  });

  console.log('🎉 Seeding successfully completed!');
  console.log(`🔗 Public URL: http://localhost:5173/rf/automotive/${article.slug}`);
}

seedTataNexonArticle()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
