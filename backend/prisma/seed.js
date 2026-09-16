import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
  const userPerms = ['comment.create', 'comment.delete_own', 'comment.like', 'comment.report', 'bookmark.manage'];
  const authorPerms = [
    ...userPerms,
    'article.create', 'article.update_own', 'article.delete_own', 'article.submit', 'media.upload', 'media.delete_own'
  ];
  const editorPerms = [
    ...authorPerms,
    'article.read_draft', 'article.update_any', 'article.approve', 'article.reject', 'article.publish',
    'article.unpublish', 'article.schedule', 'comment.moderate', 'category.manage', 'tag.manage', 'media.delete_any'
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
      role: roles.SUPER_ADMIN
    },
    {
      email: 'superadmin@researchfactors.com',
      firstName: 'Victoria',
      lastName: 'Sterling',
      bio: 'Principal System Custodian & Infrastructure Lead.',
      role: roles.SUPER_ADMIN
    },
    {
      email: 'staffadmin@researchfactors.com',
      firstName: 'Liam',
      lastName: 'Vance',
      bio: 'Editorial Operations Manager & Staff Administrator.',
      role: roles.ADMIN
    },
    {
      email: 'editor@researchfactors.com',
      firstName: 'Elena',
      lastName: 'Rostova',
      bio: 'Senior Technology & Physics Review Editor.',
      role: roles.EDITOR
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
      description: 'Emerging architectures, semiconductor engineering, quantum hardware, and artificial intelligence systems.'
    },
    {
      name: 'Science',
      slug: 'science',
      description: 'Fundamental physics, cryogenic materials, molecular biology, and empirical natural sciences.'
    },
    {
      name: 'Economics',
      slug: 'economics',
      description: 'Market structures, semiconductor supply chain analysis, capital efficiency, and technological macroeconomics.'
    },
    {
      name: 'Policy',
      slug: 'policy',
      description: 'AI governance, international chip trade export controls, and algorithmic transparency regulations.'
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

  // 6. Seed Tags
  const tagDefs = [
    { name: 'Quantum Computing', slug: 'quantum-computing' },
    { name: 'Artificial Intelligence', slug: 'artificial-intelligence' },
    { name: 'Semiconductor Architecture', slug: 'semiconductor-architecture' },
    { name: 'Energy Systems', slug: 'energy-systems' }
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

  // 7. Seed Rich Published Articles
  const author = createdUsers['author@researchfactors.com'];
  const editor = createdUsers['editor@researchfactors.com'];

  const article1 = await prisma.article.upsert({
    where: { slug: 'empirical-benchmarks-hybrid-quantum-classical-processors' },
    update: {},
    create: {
      title: 'Empirical Benchmarks of Hybrid Quantum-Classical Processing Units',
      slug: 'empirical-benchmarks-hybrid-quantum-classical-processors',
      subtitle: 'Evaluating thermal dissipation, error mitigation, and 99.4% two-qubit gate fidelity across continuous 72-hour stress testing.',
      excerpt: 'A comprehensive empirical study analyzing real-world coherence times, cryogenic dissipation limits, and algorithmic speedup in commercial hybrid processing nodes.',
      type: 'RESEARCH',
      status: 'PUBLISHED',
      readingTimeMin: 7,
      viewCount: 1420,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      authorId: author.id,
      categoryId: categories['technology'].id,
      createdById: author.id,
      publishedById: editor.id,
      coverImageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1600&q=80',
      coverImageAlt: 'Quantum computing cryogenic dilutor chamber array'
    }
  });

  // Add Blocks for Article 1
  await prisma.articleBlock.deleteMany({ where: { articleId: article1.id } });
  await prisma.articleBlock.createMany({
    data: [
      {
        articleId: article1.id,
        blockType: 'paragraph',
        position: 0,
        content: {
          text: 'The transition from noisy intermediate-scale quantum (NISQ) devices to fault-tolerant hybrid computing requires rigorous empirical benchmarks under sustained operational conditions. While theoretical estimations predict exponential speedups for specialized combinatorial optimization, real-world hardware suffers from thermal leakage, crosstalk, and decoherence induced by control line attenuation.'
        }
      },
      {
        articleId: article1.id,
        blockType: 'heading',
        position: 1,
        content: {
          level: 2,
          text: '1. Cryogenic Thermal Loading & Gate Fidelity'
        }
      },
      {
        articleId: article1.id,
        blockType: 'paragraph',
        position: 2,
        content: {
          text: 'During our continuous 72-hour benchmark of the 128-qubit superconducting transmon architecture, baseline base-temperature fluctuated within a narrow band between 11.2 mK and 12.8 mK. We observed that randomized benchmarking decay curves maintained consistent error rates below 0.6% across active qubit pairs.'
        }
      },
      {
        articleId: article1.id,
        blockType: 'callout',
        position: 3,
        content: {
          variant: 'info',
          title: 'Benchmark Finding',
          text: 'The hybrid transmon array achieved a two-qubit gate fidelity of 99.42% (±0.04%) with active dynamic decoupling, sustaining stability over 4.2 million continuous circuit executions.'
        }
      },
      {
        articleId: article1.id,
        blockType: 'heading',
        position: 4,
        content: {
          level: 2,
          text: '2. Classical Acceleration vs. Quantum Coprocessing'
        }
      },
      {
        articleId: article1.id,
        blockType: 'comparison',
        position: 5,
        content: {
          headers: ['Metric', 'HPC Cluster (Classical)', 'Hybrid QPU Coprocessor'],
          rows: [
            {
              label: 'Execution Time (Hamiltonian Sim)',
              values: ['4 hours 12 mins', '2.8 seconds']
            },
            {
              label: 'Power Draw (Total Subsystem)',
              values: ['48 kW (liquid-cooled rack)', '14 kW (including dilution cryostat)']
            },
            {
              label: 'Error Propagation Rate',
              values: ['Machine epsilon (1e-16)', '0.58% unmitigated / 0.02% mitigated']
            }
          ]
        }
      },
      {
        articleId: article1.id,
        blockType: 'quote',
        position: 6,
        content: {
          quote: 'We are no longer debating whether quantum acceleration exists in silicon—we are quantifying its exact boundary conditions in enterprise workloads.',
          author: 'Dr. Marcus Chen',
          source: 'Research Factors Proceedings, Vol. 1'
        }
      },
      {
        articleId: article1.id,
        blockType: 'paragraph',
        position: 7,
        content: {
          text: 'In conclusion, the bottleneck for industrial deployment is no longer qubit count, but rather the low-latency interconnect between classical PCIe coprocessor interfaces and cryogenic microwave pulse generators.'
        }
      }
    ]
  });

  // Link Tag
  await prisma.articleTag.upsert({
    where: {
      articleId_tagId: {
        articleId: article1.id,
        tagId: tags['quantum-computing'].id
      }
    },
    update: {},
    create: {
      articleId: article1.id,
      tagId: tags['quantum-computing'].id
    }
  });

  // Article 2
  const article2 = await prisma.article.upsert({
    where: { slug: 'thermal-dissipation-limits-gate-all-around-silicon' },
    update: {},
    create: {
      title: 'Thermal Dissipation Limits in 2-Nanometer GAAFET Silicon',
      slug: 'thermal-dissipation-limits-gate-all-around-silicon',
      subtitle: 'Analyzing sub-threshold leakage, phonon scattering, and backside power delivery in next-generation nanosheet transistors.',
      excerpt: 'As transistor gate pitches scale below 45nm, thermal resistance in vertically stacked nanosheets presents unprecedented localized hot spots.',
      type: 'ANALYSIS',
      status: 'PUBLISHED',
      readingTimeMin: 5,
      viewCount: 890,
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      authorId: author.id,
      categoryId: categories['technology'].id,
      createdById: author.id,
      publishedById: editor.id,
      coverImageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
      coverImageAlt: 'Silicon wafer with microscopic transistor circuits'
    }
  });

  await prisma.articleBlock.deleteMany({ where: { articleId: article2.id } });
  await prisma.articleBlock.createMany({
    data: [
      {
        articleId: article2.id,
        blockType: 'paragraph',
        position: 0,
        content: {
          text: 'The sunset of FinFET architectures has ushered in Gate-All-Around (GAAFET) nanosheet transistors as the standard for 2nm and 1.4nm process nodes. While GAAFET restores electro-static channel control and mitigates short-channel effects, it introduces severe heat trapping inside internal nanosheet channels.'
        }
      },
      {
        articleId: article2.id,
        blockType: 'heading',
        position: 1,
        content: {
          level: 2,
          text: 'Backside Power Delivery Network (BSPDN) Impact'
        }
      },
      {
        articleId: article2.id,
        blockType: 'paragraph',
        position: 2,
        content: {
          text: 'By segregating power rails to the reverse side of the silicon wafer using through-silicon vias (TSVs), interconnect RC delay decreases by up to 22%. However, the thermal conductivity of the thinned silicon substrate drops dramatically, requiring micro-channel diamond heat spreaders.'
        }
      }
    ]
  });

  // Link Tag
  await prisma.articleTag.upsert({
    where: {
      articleId_tagId: {
        articleId: article2.id,
        tagId: tags['semiconductor-architecture'].id
      }
    },
    update: {},
    create: {
      articleId: article2.id,
      tagId: tags['semiconductor-architecture'].id
    }
  });

  console.log('✅ Seeded published articles with rich content blocks.');

  // 9. Seed Default System Settings (PRD Section 100)
  const defaultSettings = [
    {
      key: 'general',
      category: 'general',
      isPublic: true,
      value: {
        siteName: 'Research Factors',
        tagline: 'Research that helps you understand the world.',
        contactEmail: 'editorial@researchfactors.com',
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
