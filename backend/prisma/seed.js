import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Research Factors database seed...');

  // 1. Seed Roles
  const roleNames = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'USER', 'GUEST'];
  const roles = {};

  for (const name of roleNames) {
    roles[name] = await prisma.role.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: `System role: ${name}`,
        isSystem: true
      }
    });
  }
  console.log('✅ Roles seeded:', Object.keys(roles).join(', '));

  // 2. Seed Permissions Catalog
  const permissionDefs = [
    // Article domain
    { action: 'article.create', module: 'article', description: 'Create draft article' },
    { action: 'article.read_draft', module: 'article', description: 'Read unpublished drafts' },
    { action: 'article.update_own', module: 'article', description: 'Update own articles' },
    { action: 'article.update_any', module: 'article', description: 'Update any article' },
    { action: 'article.delete_own', module: 'article', description: 'Delete own draft articles' },
    { action: 'article.delete_any', module: 'article', description: 'Delete any article' },
    { action: 'article.submit', module: 'article', description: 'Submit article for editorial review' },
    { action: 'article.approve', module: 'article', description: 'Approve article in review queue' },
    { action: 'article.reject', module: 'article', description: 'Reject article with feedback' },
    { action: 'article.publish', module: 'article', description: 'Publish approved article' },
    { action: 'article.unpublish', module: 'article', description: 'Unpublish live article' },
    { action: 'article.schedule', module: 'article', description: 'Schedule article publication' },

    // Comment domain
    { action: 'comment.create', module: 'comment', description: 'Post comments and replies' },
    { action: 'comment.delete_own', module: 'comment', description: 'Delete own comment' },
    { action: 'comment.like', module: 'comment', description: 'Like or upvote a comment' },
    { action: 'comment.report', module: 'comment', description: 'Report a comment for moderation' },
    { action: 'comment.moderate', module: 'comment', description: 'Hide, delete or restore any comment' },

    // Taxonomy domain
    { action: 'category.manage', module: 'category', description: 'Manage categories' },
    { action: 'category.merge', module: 'category', description: 'Merge redundant or duplicate categories' },
    { action: 'tag.manage', module: 'tag', description: 'Manage tags' },

    // Media domain
    { action: 'media.upload', module: 'media', description: 'Upload media assets' },
    { action: 'media.delete_own', module: 'media', description: 'Delete own media assets' },
    { action: 'media.delete_any', module: 'media', description: 'Delete any media asset' },
    { action: 'media.manage', module: 'media', description: 'Browse and inspect platform media library' },

    // User & Admin domain
    { action: 'user.create', module: 'user', description: 'Create user accounts directly with initial role assignment' },
    { action: 'user.read_list', module: 'user', description: 'View user directory' },
    { action: 'user.suspend', module: 'user', description: 'Suspend or reactivate user' },
    { action: 'author.approve', module: 'user', description: 'Approve author applications' },
    { action: 'role.assign', module: 'system', description: 'Assign roles to accounts' },
    { action: 'role.manage', module: 'system', description: 'Create and configure roles and permission matrices' },
    { action: 'admin.manage', module: 'system', description: 'Manage administrators and elevated access' },
    { action: 'system.settings', module: 'system', description: 'Manage platform settings' },
    { action: 'audit.read', module: 'system', description: 'View audit logs' },
    { action: 'contact.manage', module: 'system', description: 'Manage contact enquiries' },
    { action: 'report.manage', module: 'comment', description: 'Triage and resolve comment reports' },
    { action: 'bookmark.manage', module: 'bookmark', description: 'Save and manage bookmarks' }
  ];

  const permissions = {};
  for (const def of permissionDefs) {
    permissions[def.action] = await prisma.permission.upsert({
      where: { action: def.action },
      update: {},
      create: def
    });
  }
  console.log(`✅ Seeded ${Object.keys(permissions).length} atomic permissions.`);

  // 3. Map Permissions to Roles
  const userPerms = ['comment.create', 'comment.delete_own', 'comment.like', 'comment.report', 'bookmark.manage', 'media.upload'];
  const authorPerms = [
    ...userPerms,
    'article.create', 'article.update_own', 'article.delete_own', 'article.submit', 'media.delete_own'
  ];
  const editorPerms = [
    ...authorPerms,
    'article.read_draft', 'article.update_any', 'article.approve', 'article.reject', 'article.publish',
    'article.unpublish', 'article.schedule', 'comment.moderate', 'category.manage', 'category.merge', 'tag.manage', 'media.delete_any'
  ];
  const adminPerms = [
    ...editorPerms,
    'article.delete_any', 'user.read_list', 'user.suspend', 'author.approve', 'audit.read', 'contact.manage',
    'report.manage', 'media.manage'
  ];
  const superAdminPerms = Object.keys(permissions);

  const roleMappings = [
    { role: roles.USER, perms: userPerms },
    { role: roles.AUTHOR, perms: authorPerms },
    { role: roles.EDITOR, perms: editorPerms },
    { role: roles.ADMIN, perms: adminPerms },
    { role: roles.SUPER_ADMIN, perms: superAdminPerms }
  ];

  for (const { role, perms } of roleMappings) {
    for (const action of perms) {
      const perm = permissions[action];
      if (perm) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: perm.id
            }
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: perm.id
          }
        });
      }
    }
  }
  console.log('✅ Role-Permission mappings linked successfully.');

  // 4. Seed Development Users
  const passwordHash = await bcrypt.hash('admin123', 12);

  const seedUsers = [
    {
      email: 'admin@researchfactors.com',
      firstName: 'Alexander',
      lastName: 'Wright',
      bio: 'Chief Editor & Platform Administrator for Research Factors.',
      role: roles.SUPER_ADMIN,
      authorProfile: {
        headline: 'Chief Editor & Platform Administrator',
        biography: 'Alexander Wright directs platform editorial standards and peer review oversight at Research Factors.',
        websiteUrl: 'https://researchfactors.org/editorial',
        isApproved: true
      }
    },
    {
      email: 'superadmin@researchfactors.com',
      firstName: 'Victoria',
      lastName: 'Sterling',
      bio: 'Principal System Custodian & Infrastructure Lead.',
      role: roles.SUPER_ADMIN,
      authorProfile: {
        headline: 'Principal System Custodian & Infrastructure Lead',
        biography: 'Victoria Sterling oversees system architecture, data governance, and core platform resilience.',
        websiteUrl: 'https://researchfactors.org',
        isApproved: true
      }
    },
    {
      email: 'staffadmin@researchfactors.com',
      firstName: 'Liam',
      lastName: 'Vance',
      bio: 'Editorial Operations Manager & Staff Administrator.',
      role: roles.ADMIN,
      authorProfile: {
        headline: 'Editorial Operations Manager & Staff Administrator',
        biography: 'Liam Vance coordinates researcher accreditation, article pipelines, and editorial workflows.',
        isApproved: true
      }
    },
    {
      email: 'editor@researchfactors.com',
      firstName: 'Elena',
      lastName: 'Rostova',
      bio: 'Senior Technology & Physics Review Editor.',
      role: roles.EDITOR,
      authorProfile: {
        headline: 'Senior Technology & Physics Review Editor',
        biography: 'Elena Rostova oversees empirical technology articles and solid-state physics investigations.',
        isApproved: true
      }
    },
    {
      email: 'author@researchfactors.com',
      firstName: 'Dr. Marcus',
      lastName: 'Chen',
      bio: 'Research Fellow in Quantum Computing Architecture & Solid-State Physics.',
      role: roles.AUTHOR,
      authorProfile: {
        headline: 'Lead Systems Architect & Quantum Hardware Analyst',
        biography: 'Dr. Marcus Chen conducts empirical benchmarks on cryogenic computing systems and heterogeneous silicon architecture.',
        websiteUrl: 'https://marcuschen.research',
        twitterUrl: 'https://x.com/drmarcuschen',
        linkedinUrl: 'https://linkedin.com/in/marcuschen-phd',
        isApproved: true
      }
    },
    {
      email: 'reader@researchfactors.com',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      bio: 'Curious reader and technology policy analyst.',
      role: roles.USER
    }
  ];

  const createdUsers = {};
  for (const u of seedUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash,
        isEmailVerified: true
      },
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        bio: u.bio,
        isEmailVerified: true,
        status: 'ACTIVE'
      }
    });

    createdUsers[u.email] = user;

    // Link Role
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: u.role.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        roleId: u.role.id
      }
    });

    // Author Profile if present
    if (u.authorProfile) {
      await prisma.authorProfile.upsert({
        where: { userId: user.id },
        update: u.authorProfile,
        create: {
          userId: user.id,
          ...u.authorProfile
        }
      });
    }
  }
  console.log('✅ Seeded users: admin, editor, author, reader (Password: admin123).');

  // 5. Seed Categories
  const categoryDefs = [
    {
      name: 'Technology',
      slug: 'technology',
      description: 'Emerging architectures, semiconductor engineering, quantum hardware, and artificial intelligence systems.',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Business',
      slug: 'business',
      description: 'Capital allocation, enterprise software unit economics, industrial supply chains, and market structures.',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Science',
      slug: 'science',
      description: 'Fundamental physics, cryogenic materials, molecular biology, and empirical natural sciences.',
      imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Economics',
      slug: 'economics',
      description: 'Market structures, semiconductor supply chain analysis, capital efficiency, and technological macroeconomics.',
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Policy',
      slug: 'policy',
      description: 'AI governance, international chip trade export controls, and algorithmic transparency regulations.',
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Lifestyle',
      slug: 'lifestyle',
      description: 'Clinical chronobiology, evidence-based ergonomics, sensory physiology, and preventative health science.',
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Automotive',
      slug: 'automotive',
      description: 'Next-generation mobility, electric vehicle powertrain engineering, autonomous vehicle perception pipelines, and battery chemistry.',
      imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Fashion',
      slug: 'fashion',
      description: 'Textile material science, circular manufacturing supply chains, smart wearable textiles, and sustainable fashion engineering.',
      imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80'
    }
  ];

  const categories = {};
  for (const c of categoryDefs) {
    categories[c.slug] = await prisma.category.upsert({
      where: { slug: c.slug },
      update: c,
      create: c
    });
  }
  console.log('✅ Categories seeded:', Object.keys(categories).join(', '));

  // 6. Seed Default Tags
  const tagDefs = [
    { name: 'Quantum Computing', slug: 'quantum-computing' },
    { name: 'Artificial Intelligence', slug: 'artificial-intelligence' },
    { name: 'Semiconductor Architecture', slug: 'semiconductor-architecture' },
    { name: 'Energy Systems', slug: 'energy-systems' },
    { name: 'Electric Vehicles', slug: 'electric-vehicles' },
    { name: 'Automotive Engineering', slug: 'automotive-engineering' },
    { name: 'Sustainable Textiles', slug: 'sustainable-textiles' },
    { name: 'Circular Economy', slug: 'circular-economy' }
  ];

  const tags = {};
  for (const t of tagDefs) {
    tags[t.slug] = await prisma.tag.upsert({
      where: { slug: t.slug },
      update: t,
      create: t
    });
  }
  console.log('✅ Tags seeded:', Object.keys(tags).join(', '));

  // 7. Seed Articles from Fallback Data (18 Canonical Offline Articles)
  const defaultAuthor = createdUsers['author@researchfactors.com'];
  const defaultEditor = createdUsers['editor@researchfactors.com'];

  const fallbackDataPath = path.resolve(__dirname, '../../frontend/src/data/fallbackData.json');
  let fallbackArticles = [];

  if (fs.existsSync(fallbackDataPath)) {
    try {
      const parsedData = JSON.parse(fs.readFileSync(fallbackDataPath, 'utf8'));
      fallbackArticles = parsedData.articles || [];
      console.log(`📖 Loaded ${fallbackArticles.length} fallback articles from frontend/src/data/fallbackData.json.`);
    } catch (err) {
      console.warn('⚠️ Could not load fallbackData.json:', err.message);
    }
  }

  // Helper to resolve or create author for each article
  const authorCache = {};
  async function resolveArticleAuthor(authorData) {
    if (!authorData || (!authorData.fullName && !authorData.firstName)) {
      return defaultAuthor;
    }
    const fullName = authorData.fullName || `${authorData.firstName || ''} ${authorData.lastName || ''}`.trim();
    if (authorCache[fullName]) return authorCache[fullName];

    const emailHandle = fullName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\.|\.$/g, '');
    const email = `${emailHandle || 'author'}@researchfactors.com`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        avatarUrl: authorData.avatarUrl || null,
        bio: authorData.authorProfile?.bio || authorData.bio || null
      },
      create: {
        email,
        passwordHash,
        firstName: authorData.firstName || fullName.split(' ')[0] || 'Contributing',
        lastName: authorData.lastName || fullName.split(' ').slice(1).join(' ') || 'Fellow',
        bio: authorData.authorProfile?.bio || authorData.bio || 'Research Fellow at Research Factors.',
        avatarUrl: authorData.avatarUrl || null,
        isEmailVerified: true,
        status: 'ACTIVE'
      }
    });

    // Ensure AUTHOR role linked
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: roles.AUTHOR.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        roleId: roles.AUTHOR.id
      }
    });

    // Ensure AuthorProfile exists
    await prisma.authorProfile.upsert({
      where: { userId: user.id },
      update: {
        headline: authorData.authorProfile?.headline || authorData.headline || 'Research Analyst',
        biography: authorData.authorProfile?.bio || authorData.bio || null,
        isApproved: true
      },
      create: {
        userId: user.id,
        headline: authorData.authorProfile?.headline || authorData.headline || 'Research Analyst',
        biography: authorData.authorProfile?.bio || authorData.bio || null,
        isApproved: true
      }
    });

    authorCache[fullName] = user;
    return user;
  }

  // Seed all 18 fallback articles into the database
  const validArticleTypes = ['RESEARCH', 'REVIEW', 'COMPARISON', 'GUIDE', 'ANALYSIS', 'OPINION'];
  let seededFallbackCount = 0;
  for (const a of fallbackArticles) {
    const authorUser = await resolveArticleAuthor(a.author);
    const catSlug = a.category?.slug?.toLowerCase();
    const categoryRecord = categories[catSlug] || categories['technology'];

    let mappedType = (a.type || 'RESEARCH').toUpperCase();
    if (!validArticleTypes.includes(mappedType)) {
      mappedType = mappedType === 'INVESTIGATION' ? 'ANALYSIS' : 'RESEARCH';
    }

    const articleRecord = await prisma.article.upsert({
      where: { slug: a.slug },
      update: {
        title: a.title,
        subtitle: a.subtitle || null,
        excerpt: a.excerpt || null,
        type: mappedType,
        status: 'PUBLISHED',
        readingTimeMin: a.readingTimeMin || 5,
        viewCount: a.viewCount || 250,
        isFeatured: Boolean(a.isFeatured),
        publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
        coverImageUrl: a.coverImageUrl || null,
        coverImageAlt: a.coverImageAlt || a.title,
        authorId: authorUser.id,
        categoryId: categoryRecord.id
      },
      create: {
        title: a.title,
        slug: a.slug,
        subtitle: a.subtitle || null,
        excerpt: a.excerpt || null,
        type: mappedType,
        status: 'PUBLISHED',
        readingTimeMin: a.readingTimeMin || 5,
        viewCount: a.viewCount || 250,
        isFeatured: Boolean(a.isFeatured),
        publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
        coverImageUrl: a.coverImageUrl || null,
        coverImageAlt: a.coverImageAlt || a.title,
        authorId: authorUser.id,
        categoryId: categoryRecord.id,
        createdById: authorUser.id,
        publishedById: defaultEditor.id
      }
    });

    // Seed Blocks
    if (Array.isArray(a.blocks) && a.blocks.length > 0) {
      await prisma.articleBlock.deleteMany({ where: { articleId: articleRecord.id } });
      await prisma.articleBlock.createMany({
        data: a.blocks.map((block, idx) => ({
          articleId: articleRecord.id,
          blockType: block.blockType || 'paragraph',
          position: idx,
          content: block.content || {},
          metadata: block.metadata || null
        }))
      });
    }

    // Seed Tags
    if (Array.isArray(a.tags) && a.tags.length > 0) {
      await prisma.articleTag.deleteMany({ where: { articleId: articleRecord.id } });
      for (const t of a.tags) {
        const tagRecord = await prisma.tag.upsert({
          where: { slug: t.slug },
          update: { name: t.name },
          create: { name: t.name, slug: t.slug }
        });
        await prisma.articleTag.create({
          data: {
            articleId: articleRecord.id,
            tagId: tagRecord.id
          }
        });
      }
    }

    // Record slug history
    await prisma.articleSlugHistory.upsert({
      where: { slug: a.slug },
      update: {},
      create: {
        slug: a.slug,
        articleId: articleRecord.id
      }
    });

    seededFallbackCount++;
  }
  console.log(`✅ Seeded ${seededFallbackCount} fallback articles into the database with blocks and tags.`);

  // 8. Seed Rich Empirical Articles for Automotive & Fashion
  const autoArticle = await prisma.article.upsert({
    where: { slug: 'solid-state-battery-dendrite-kinetics-ev-platforms' },
    update: {},
    create: {
      title: 'Solid-State Ceramic Electrolytes: Dendrite Growth and Fast-Charging Kinetics in 800V EV Architectures',
      slug: 'solid-state-battery-dendrite-kinetics-ev-platforms',
      subtitle: 'Evaluating sulfide-based LLZO solid electrolytes, critical current densities, and thermal runaway thresholds under 4C charge rates.',
      excerpt: 'An empirical benchmark analyzing localized mechanical stress, lithium filament propagation, and capacity retention across 1,200 continuous rapid-charge thermal cycles.',
      type: 'RESEARCH',
      status: 'PUBLISHED',
      readingTimeMin: 11,
      viewCount: 1680,
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      authorId: defaultAuthor.id,
      categoryId: categories['automotive'].id,
      createdById: defaultAuthor.id,
      publishedById: defaultEditor.id,
      coverImageUrl: 'https://images.unsplash.com/photo-1558441719-aa34bbe5f347?auto=format&fit=crop&w=1600&q=80',
      coverImageAlt: 'Automotive battery pouch cell pack architecture'
    }
  });

  await prisma.articleBlock.deleteMany({ where: { articleId: autoArticle.id } });
  await prisma.articleBlock.createMany({
    data: [
      {
        articleId: autoArticle.id,
        blockType: 'paragraph',
        position: 0,
        content: {
          text: 'The commercial viability of mass-market 800V electric vehicle architectures hinges on overcoming the thermal and mechanical limitations of liquid-electrolyte lithium-ion cells. Solid-state lithium-metal batteries promise volumetric energy densities exceeding 450 Wh/kg, but suffer from localized mechanical failure under rapid charge cycling.'
        }
      },
      {
        articleId: autoArticle.id,
        blockType: 'heading',
        position: 1,
        content: {
          level: 2,
          text: '1. Critical Current Density & Dendrite Infiltration'
        }
      },
      {
        articleId: autoArticle.id,
        blockType: 'paragraph',
        position: 2,
        content: {
          text: 'In our 1,200-cycle continuous benchmark of sulfide-type glass-ceramic electrolytes at 30°C, cell impedance remained stable up to 3.8 mA/cm². Beyond this threshold, intergranular stress concentrations triggered lithium filament propagation along grain boundaries, demonstrating the necessity of active stack pressure management.'
        }
      },
      {
        articleId: autoArticle.id,
        blockType: 'callout',
        position: 3,
        content: {
          variant: 'info',
          title: 'Empirical Benchmark Finding',
          text: 'Maintaining a constant uniaxial stack pressure of 5.2 MPa suppressed 99.1% of intergranular dendrite nucleation, enabling 4C fast-charging to 80% state-of-charge within 11.4 minutes without micro-shorting.'
        }
      },
      {
        articleId: autoArticle.id,
        blockType: 'heading',
        position: 4,
        content: {
          level: 2,
          text: '2. Comparative Pack-Level Performance'
        }
      },
      {
        articleId: autoArticle.id,
        blockType: 'table',
        position: 5,
        content: {
          headers: ['Chemistry Architecture', 'Gravimetric Density (Wh/kg)', '4C Cycle Life', 'Thermal Runaway Onset (°C)'],
          rows: [
            {
              label: 'Conventional NMC811 (Liquid)',
              values: ['265 Wh/kg', '450 cycles', '210°C']
            },
            {
              label: 'Silicon-Graphite Anode (Liquid)',
              values: ['310 Wh/kg', '620 cycles', '225°C']
            },
            {
              label: 'LLZO Ceramic Solid-State (Li-Metal)',
              values: ['460 Wh/kg', '1,200+ cycles', '380°C']
            }
          ]
        }
      },
      {
        articleId: autoArticle.id,
        blockType: 'quote',
        position: 6,
        content: {
          text: 'Electrolyte substitution alone is insufficient; automotive solid-state requires integrating dynamic pneumatic pressure regulation directly into module mechanical casings.',
          author: 'Dr. Marcus Chen',
          citation: 'Journal of Automotive Power & Materials Engineering'
        }
      }
    ]
  });

  await prisma.articleTag.upsert({
    where: { articleId_tagId: { articleId: autoArticle.id, tagId: tags['electric-vehicles'].id } },
    update: {},
    create: { articleId: autoArticle.id, tagId: tags['electric-vehicles'].id }
  });
  await prisma.articleTag.upsert({
    where: { articleId_tagId: { articleId: autoArticle.id, tagId: tags['automotive-engineering'].id } },
    update: {},
    create: { articleId: autoArticle.id, tagId: tags['automotive-engineering'].id }
  });

  const fashionArticle = await prisma.article.upsert({
    where: { slug: 'microfiber-shedding-kinetics-circular-polyester-textiles' },
    update: {},
    create: {
      title: 'Microfiber Shedding Kinetics and Tensile Fatigue in Recycled Circular Polyester Textiles',
      slug: 'microfiber-shedding-kinetics-circular-polyester-textiles',
      subtitle: 'Quantifying filament fracture mechanics, microplastic dispersion rates, and closed-loop chemical depolymerization yields.',
      excerpt: 'An empirical materials study analyzing fiber shear degradation, laundering hydrodynamic shedding, and tensile hysteresis in post-consumer circular apparel.',
      type: 'RESEARCH',
      status: 'PUBLISHED',
      readingTimeMin: 9,
      viewCount: 1340,
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      authorId: defaultAuthor.id,
      categoryId: categories['fashion'].id,
      createdById: defaultAuthor.id,
      publishedById: defaultEditor.id,
      coverImageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1600&q=80',
      coverImageAlt: 'Sustainable textile filament weaving loom'
    }
  });

  await prisma.articleBlock.deleteMany({ where: { articleId: fashionArticle.id } });
  await prisma.articleBlock.createMany({
    data: [
      {
        articleId: fashionArticle.id,
        blockType: 'paragraph',
        position: 0,
        content: {
          text: 'The transition toward circular fashion manufacturing relies heavily on mechanical and chemical recycling of polyethylene terephthalate (PET) fibers. However, multiple extrusion cycles alter polymer crystallinity and tensile hysteresis, significantly accelerating microplastic filament fragmentation during commercial laundering.'
        }
      },
      {
        articleId: fashionArticle.id,
        blockType: 'heading',
        position: 1,
        content: {
          level: 2,
          text: '1. Hydrodynamic Shedding Rates Across 50 Wash Cycles'
        }
      },
      {
        articleId: fashionArticle.id,
        blockType: 'paragraph',
        position: 2,
        content: {
          text: 'Using high-resolution spectroscopic filtration, we measured microfilament mass loss across 50 standard ISO 6330 wash cycles. Virgin polyester exhibited an average mass release of 18.4 mg/kg of fabric, whereas mechanically recycled rPET reached 64.2 mg/kg due to surface fibril detachment along micro-voids.'
        }
      },
      {
        articleId: fashionArticle.id,
        blockType: 'callout',
        position: 3,
        content: {
          variant: 'info',
          title: 'Material Science Finding',
          text: 'Enzymatic glycolysis depolymerization preserved 98.6% of intrinsic viscosity in regenerated monomers, producing filament yarn with shedding rates indistinguishable from virgin grade polymer.'
        }
      },
      {
        articleId: fashionArticle.id,
        blockType: 'table',
        position: 4,
        content: {
          headers: ['Polymer Recycling Method', 'Tensile Tenacity (cN/dtex)', 'Intrinsic Viscosity (dL/g)', 'Microfiber Loss (mg/kg)'],
          rows: [
            {
              label: 'Virgin Synthetic Polyester',
              values: ['4.8 cN/dtex', '0.64 dL/g', '18.4 mg/kg']
            },
            {
              label: 'Mechanical Flake Extrusion (rPET)',
              values: ['3.2 cN/dtex', '0.52 dL/g', '64.2 mg/kg']
            },
            {
              label: 'Closed-Loop Enzymatic Glycolysis',
              values: ['4.7 cN/dtex', '0.63 dL/g', '19.1 mg/kg']
            }
          ]
        }
      }
    ]
  });

  await prisma.articleTag.upsert({
    where: { articleId_tagId: { articleId: fashionArticle.id, tagId: tags['sustainable-textiles'].id } },
    update: {},
    create: { articleId: fashionArticle.id, tagId: tags['sustainable-textiles'].id }
  });
  await prisma.articleTag.upsert({
    where: { articleId_tagId: { articleId: fashionArticle.id, tagId: tags['circular-economy'].id } },
    update: {},
    create: { articleId: fashionArticle.id, tagId: tags['circular-economy'].id }
  });

  console.log('✅ Seeded dedicated research articles for Automotive and Fashion categories.');

  // 9. Seed Default System Settings (PRD Section 100)
  const defaultSettings = [
    {
      key: 'general',
      category: 'general',
      isPublic: true,
      value: {
        siteName: 'Research Factors',
        tagline: 'Research that helps you understand the world.',
        contactEmail: 'contact@researchfactors.com',
        socialLinks: {
          twitter: 'https://twitter.com/researchfactors',
          linkedin: 'https://linkedin.com/company/researchfactors',
          github: 'https://github.com/researchfactors'
        }
      }
    },
    {
      key: 'seo',
      category: 'seo',
      isPublic: true,
      value: {
        defaultTitle: 'Research Factors | Production-Grade Research Publishing',
        defaultDescription: 'Explore peer-reviewed research, technological breakdowns, microeconomic analyses, and empirical comparisons.',
        openGraphImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80'
      }
    },
    {
      key: 'policies',
      category: 'policies',
      isPublic: false,
      value: {
        allowRegistration: true,
        requireEmailVerification: true,
        commentsEnabled: true,
        autoHideReportThreshold: 3,
        maintenanceMode: false
      }
    }
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s
    });
  }
  console.log('✅ Seeded default platform system configuration.');

  // 12. Seed Standalone Article JSONs (e.g. Tata Nexon Powertrain Benchmark)
  const articlesJsonDir = path.resolve(__dirname, '../src/data/articles');
  if (fs.existsSync(articlesJsonDir)) {
    const jsonFiles = fs.readdirSync(articlesJsonDir).filter((f) => f.endsWith('.json'));
    for (const jFile of jsonFiles) {
      try {
        const artData = JSON.parse(fs.readFileSync(path.join(articlesJsonDir, jFile), 'utf8'));
        const catSlug = artData.categorySlug || 'automotive';
        const targetCategory = categories[catSlug] || await prisma.category.findUnique({ where: { slug: catSlug } });
        if (!targetCategory) continue;

        const artRecord = await prisma.article.upsert({
          where: { slug: artData.slug },
          update: {
            title: artData.title,
            subtitle: artData.subtitle,
            excerpt: artData.excerpt,
            type: artData.type,
            status: artData.status || 'PUBLISHED',
            readingTimeMin: artData.readingTimeMin || 8,
            coverImageUrl: artData.coverImageUrl,
            coverImageAlt: artData.coverImageAlt,
            isFeatured: artData.isFeatured ?? true,
            categoryId: targetCategory.id,
            authorId: defaultAuthor.id,
            createdById: defaultAuthor.id,
            publishedById: defaultEditor.id,
            publishedAt: new Date('2026-10-03T10:00:00.000Z'),
            seoTitle: artData.seoTitle,
            seoDescription: artData.seoDescription,
            canonicalUrl: artData.canonicalUrl
          },
          create: {
            title: artData.title,
            slug: artData.slug,
            subtitle: artData.subtitle,
            excerpt: artData.excerpt,
            type: artData.type,
            status: artData.status || 'PUBLISHED',
            readingTimeMin: artData.readingTimeMin || 8,
            viewCount: 420,
            coverImageUrl: artData.coverImageUrl,
            coverImageAlt: artData.coverImageAlt,
            isFeatured: artData.isFeatured ?? true,
            categoryId: targetCategory.id,
            authorId: defaultAuthor.id,
            createdById: defaultAuthor.id,
            publishedById: defaultEditor.id,
            publishedAt: new Date('2026-10-03T10:00:00.000Z'),
            seoTitle: artData.seoTitle,
            seoDescription: artData.seoDescription,
            canonicalUrl: artData.canonicalUrl
          }
        });

        if (Array.isArray(artData.blocks) && artData.blocks.length > 0) {
          await prisma.articleBlock.deleteMany({ where: { articleId: artRecord.id } });
          await prisma.articleBlock.createMany({
            data: artData.blocks.map((b, idx) => ({
              articleId: artRecord.id,
              blockType: b.blockType,
              position: b.position ?? idx,
              content: b.content,
              metadata: b.metadata || null
            }))
          });
        }

        if (Array.isArray(artData.tags) && artData.tags.length > 0) {
          await prisma.articleTag.deleteMany({ where: { articleId: artRecord.id } });
          for (const t of artData.tags) {
            const tagRec = await prisma.tag.upsert({
              where: { slug: t.slug },
              update: { name: t.name },
              create: { name: t.name, slug: t.slug }
            });
            await prisma.articleTag.create({
              data: { articleId: artRecord.id, tagId: tagRec.id }
            });
          }
        }

        await prisma.articleSlugHistory.upsert({
          where: { slug: artRecord.slug },
          update: {},
          create: { slug: artRecord.slug, articleId: artRecord.id }
        });

        console.log(`✅ Loaded and seeded standalone article JSON: ${artRecord.title}`);
      } catch (err) {
        console.warn(`⚠️ Could not process ${jFile}:`, err.message);
      }
    }
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
