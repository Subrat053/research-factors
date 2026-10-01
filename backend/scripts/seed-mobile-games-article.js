import { prisma } from '../src/config/db.js';

async function seedMobileGamesArticle() {
  console.log('🚀 Starting Mobile Games Comparison Article Ingestion...');

  // 1. Upsert Parent Category: Sports
  const sportsCategory = await prisma.category.upsert({
    where: { slug: 'sports' },
    update: {
      name: 'Sports',
      description: 'Empirical research, athletic performance benchmarks, sports science, and competitive industry analytics.',
      isActive: true,
      showInFooter: true,
      seoTitle: 'Sports Research, Analytics & Performance Benchmarks | Research Factors',
      seoDescription: 'Peer-reviewed research and empirical analysis across athletic performance, global sports leagues, and competitive entertainment.'
    },
    create: {
      name: 'Sports',
      slug: 'sports',
      description: 'Empirical research, athletic performance benchmarks, sports science, and competitive industry analytics.',
      isActive: true,
      showInFooter: true,
      seoTitle: 'Sports Research, Analytics & Performance Benchmarks | Research Factors',
      seoDescription: 'Peer-reviewed research and empirical analysis across athletic performance, global sports leagues, and competitive entertainment.'
    }
  });
  console.log(`✅ Parent Category 'Sports' ready: ${sportsCategory.id}`);

  // 2. Upsert Subcategory: Gaming (Child of Sports)
  const gamingCategory = await prisma.category.upsert({
    where: { slug: 'gaming' },
    update: {
      name: 'Gaming',
      description: 'Empirical research, market benchmarks, and comparative evaluations across mobile games, live-service ecosystems, and competitive esports.',
      isActive: true,
      showInFooter: true,
      parentId: sportsCategory.id,
      seoTitle: 'Gaming & Esports Research, Benchmarks & Industry Analyses | Research Factors',
      seoDescription: 'Peer-reviewed insights, player retention benchmarks, and comparative analyses of leading gaming and esports ecosystems.'
    },
    create: {
      name: 'Gaming',
      slug: 'gaming',
      description: 'Empirical research, market benchmarks, and comparative evaluations across mobile games, live-service ecosystems, and competitive esports.',
      isActive: true,
      showInFooter: true,
      parentId: sportsCategory.id,
      seoTitle: 'Gaming & Esports Research, Benchmarks & Industry Analyses | Research Factors',
      seoDescription: 'Peer-reviewed insights, player retention benchmarks, and comparative analyses of leading gaming and esports ecosystems.'
    }
  });
  console.log(`✅ Subcategory 'Gaming' ready (parent: Sports): ${gamingCategory.id}`);

  // 3. Upsert Subcategory: Cricket (Child of Sports)
  const cricketCategory = await prisma.category.upsert({
    where: { slug: 'cricket' },
    update: {
      name: 'Cricket',
      description: 'Statistical performance analytics, biomechanics, tournament economics, and sports science in professional cricket.',
      isActive: true,
      showInFooter: true,
      parentId: sportsCategory.id,
      seoTitle: 'Cricket Analytics, Biomechanics & Tournament Research | Research Factors',
      seoDescription: 'Empirical data, player performance modeling, and sports science investigations across international cricket.'
    },
    create: {
      name: 'Cricket',
      slug: 'cricket',
      description: 'Statistical performance analytics, biomechanics, tournament economics, and sports science in professional cricket.',
      isActive: true,
      showInFooter: true,
      parentId: sportsCategory.id,
      seoTitle: 'Cricket Analytics, Biomechanics & Tournament Research | Research Factors',
      seoDescription: 'Empirical data, player performance modeling, and sports science investigations across international cricket.'
    }
  });
  console.log(`✅ Subcategory 'Cricket' ready (parent: Sports): ${cricketCategory.id}`);

  // 4. Upsert the 7 Topic Tags
  const tagDefinitions = [
    { name: 'Best Mobile Games', slug: 'best-mobile-games' },
    { name: 'Most Popular Mobile Games', slug: 'most-popular-mobile-games' },
    { name: 'Mobile Game Revenue', slug: 'mobile-game-revenue' },
    { name: 'Mobile Games 2026', slug: 'mobile-games-2026' },
    { name: 'Mobile Gaming Trends', slug: 'mobile-gaming-trends' },
    { name: 'Online Mobile Games', slug: 'online-mobile-games' },
    { name: 'Popular Mobile Games', slug: 'popular-mobile-games' }
  ];

  const tagRecords = [];
  for (const tDef of tagDefinitions) {
    const tRec = await prisma.tag.upsert({
      where: { slug: tDef.slug },
      update: { name: tDef.name },
      create: { name: tDef.name, slug: tDef.slug }
    });
    tagRecords.push(tRec);
  }
  console.log(`✅ ${tagRecords.length} Tags upserted.`);

  // 5. Find an active author
  let author = await prisma.user.findFirst({
    where: {
      email: 'author@researchfactors.com',
      status: 'ACTIVE'
    }
  });
  if (!author) {
    author = await prisma.user.findFirst({
      where: { status: 'ACTIVE' }
    });
  }
  if (!author) {
    throw new Error('No active author found in database!');
  }
  console.log(`✅ Author selected: ${author.firstName} ${author.lastName} (${author.email})`);

  // 6. Upsert the Article
  const articleSlug = 'top-widely-played-mobile-games-in-2026-comprehensive-comparison-of-global-hits';
  const article = await prisma.article.upsert({
    where: { slug: articleSlug },
    update: {
      title: 'Top Widely Played Mobile Games in 2026: Comprehensive Comparison of Global Hits',
      subtitle: 'An exhaustive evaluation of the leading mobile games active in 2026, comparing player bases, revenue benchmarks, user retention metrics, and future gameplay trajectories.',
      excerpt: 'In 2026, the mobile gaming ecosystem continues to expand with unprecedented user acquisition, engagement, and monetization across diverse categories from tactical battle royales to casual puzzle games. This empirical comparison benchmarks the industry leaders.',
      coverImageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
      coverImageAlt: 'Player holding smartphone experiencing multiplayer mobile gaming tournament',
      type: 'COMPARISON',
      status: 'PUBLISHED',
      readingTimeMin: 8,
      viewCount: 184,
      isFeatured: true,
      categoryId: gamingCategory.id,
      authorId: author.id,
      createdById: author.id,
      publishedById: author.id,
      publishedAt: new Date('2026-04-14T10:00:00.000Z'),
      seoTitle: 'Top Widely Played Mobile Games in 2026: Global Comparison | Research Factors',
      seoDescription: 'Comprehensive comparison and benchmark of the top widely played mobile games in 2026, evaluating active player counts, revenue generation, and gameplay mechanics.',
      canonicalUrl: `https://researchfactors.com/gaming/${articleSlug}`
    },
    create: {
      title: 'Top Widely Played Mobile Games in 2026: Comprehensive Comparison of Global Hits',
      slug: articleSlug,
      subtitle: 'An exhaustive evaluation of the leading mobile games active in 2026, comparing player bases, revenue benchmarks, user retention metrics, and future gameplay trajectories.',
      excerpt: 'In 2026, the mobile gaming ecosystem continues to expand with unprecedented user acquisition, engagement, and monetization across diverse categories from tactical battle royales to casual puzzle games. This empirical comparison benchmarks the industry leaders.',
      coverImageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
      coverImageAlt: 'Player holding smartphone experiencing multiplayer mobile gaming tournament',
      type: 'COMPARISON',
      status: 'PUBLISHED',
      readingTimeMin: 8,
      viewCount: 184,
      isFeatured: true,
      categoryId: gamingCategory.id,
      authorId: author.id,
      createdById: author.id,
      publishedById: author.id,
      publishedAt: new Date('2026-04-14T10:00:00.000Z'),
      seoTitle: 'Top Widely Played Mobile Games in 2026: Global Comparison | Research Factors',
      seoDescription: 'Comprehensive comparison and benchmark of the top widely played mobile games in 2026, evaluating active player counts, revenue generation, and gameplay mechanics.',
      canonicalUrl: `https://researchfactors.com/gaming/${articleSlug}`
    }
  });
  console.log(`✅ Article record ready: ${article.id}`);

  // 7. Associate Article Tags
  await prisma.articleTag.deleteMany({
    where: { articleId: article.id }
  });
  await prisma.articleTag.createMany({
    data: tagRecords.map((t) => ({
      articleId: article.id,
      tagId: t.id
    }))
  });
  console.log(`✅ 7 ArticleTag links established.`);

  // 8. Re-seed Structured Blocks
  await prisma.articleBlock.deleteMany({
    where: { articleId: article.id }
  });

  const blocksData = [
    // Position 0: Introduction Paragraph
    {
      articleId: article.id,
      blockType: 'paragraph',
      position: 0,
      content: {
        text: 'In 2026, the mobile gaming ecosystem continues to expand with unprecedented user acquisition, engagement, and monetization across diverse categories from tactical battle royales to casual puzzle games. Millions of players worldwide log on daily to enjoy immersive digital gameplay. This article explores the most widely played mobile games active in 2026, comparing player bases, gameplay features, monetization models, and future trends shaping the industry landscape.'
      }
    },

    // Position 1: Heading 1
    {
      articleId: article.id,
      blockType: 'heading',
      position: 1,
      content: {
        level: 2,
        text: 'Leading Mobile Games by Active User Base in 2026'
      }
    },

    // Position 2: Paragraph 1
    {
      articleId: article.id,
      blockType: 'paragraph',
      position: 2,
      content: {
        text: 'Analyzing daily and monthly active users provides clear insights into the true popularity of mobile titles. Modern gaming giants span across tactical battle royales, open-world RPGs, and multiplayer arenas. Titles like Free Fire and PUBG Mobile remain dominant forces, holding top positions thanks to their competitive multiplayer mechanics and continuous live-service updates. Genshin Impact and Mobile Legends: Bang Bang also capture enormous active player bases across multiple continents.'
      }
    },

    // Position 3: Quantitative Comparison Matrix Table
    {
      articleId: article.id,
      blockType: 'comparison',
      position: 3,
      content: {
        headers: ['Game Title', 'Genre / Mode', 'Estimated DAU (2026)', 'Primary Monetization', 'Esports & Community Scale'],
        rows: [
          ['Free Fire', 'Battle Royale', '110M+ Daily Active', 'Battle Pass & Cosmetics', 'Free Fire World Series (FFWS)'],
          ['PUBG Mobile', 'Tactical Shooter', '95M+ Daily Active', 'Royale Pass & Weapon Skins', 'PMGC Global Championship'],
          ['Roblox', 'Sandbox & UGC Meta', '85M+ Daily Active', 'Robux Currency & Creator Share', 'RDC Global Developer Guilds'],
          ['Genshin Impact', 'Open-World Action RPG', '60M+ Daily Active', 'Gacha Banners & Battle Pass', 'Global Fandom & HoyoFest Tour'],
          ['Honor of Kings', '5v5 Multiplayer MOBA', '100M+ Daily Active', 'Hero Customization & Seasons', 'King Pro League (KPL Circuits)']
        ]
      }
    },

    // Position 4: Heading 2
    {
      articleId: article.id,
      blockType: 'heading',
      position: 4,
      content: {
        level: 2,
        text: 'Revenue Champions: Games Dominating Mobile Earnings'
      }
    },

    // Position 5: Paragraph 2
    {
      articleId: article.id,
      blockType: 'paragraph',
      position: 5,
      content: {
        text: 'Player spending remains a primary metric for evaluating the longevity and financial success of modern titles. Top revenue-generating games employ sophisticated in-app purchase (IAP) ecosystems and seasonal battle passes. Battle royales and strategy titles dominate in this category, with titles like Honor of Kings and Roblox maintaining strong financial performances across iOS and Android ecosystems globally.'
      }
    },

    // Position 6: Heading 3
    {
      articleId: article.id,
      blockType: 'heading',
      position: 6,
      content: {
        level: 2,
        text: 'Game Mechanics and Features Driving Popularity'
      }
    },

    // Position 7: Paragraph 3
    {
      articleId: article.id,
      blockType: 'paragraph',
      position: 7,
      content: {
        text: 'The widespread appeal of these games stems from a blend of accessible controls, regular content drops, and robust social systems. Modern mobile gamers expect seamless matchmaking, cross-progression, and competitive ranked modes. Cross-play functionality and high-frequency content updates have proven essential in sustaining engagement across long product lifecycles.'
      }
    },

    // Position 8: Heading 4
    {
      articleId: article.id,
      blockType: 'heading',
      position: 8,
      content: {
        level: 2,
        text: 'Comparing User Engagement and Community Support'
      }
    },

    // Position 9: Paragraph 4
    {
      articleId: article.id,
      blockType: 'paragraph',
      position: 9,
      content: {
        text: 'Community and esports infrastructure play a vital role in sustaining a game\'s active player base. Leading titles maintain dedicated competitive leagues, community forums, and global esports circuits. Games like Mobile Legends and PUBG Mobile host massive global tournaments, bringing millions of spectators together and cementing deep community loyalty.'
      }
    },

    // Position 10: Heading 5
    {
      articleId: article.id,
      blockType: 'heading',
      position: 10,
      content: {
        level: 2,
        text: 'Future Trends in Mobile Gaming for 2026 and Beyond'
      }
    },

    // Position 11: Paragraph 5
    {
      articleId: article.id,
      blockType: 'paragraph',
      position: 11,
      content: {
        text: 'Looking ahead, mobile gaming is entering a phase characterized by cloud-assisted rendering, cross-platform synergy, and deeper social integration. Developers are increasingly implementing console-quality graphics, cross-device progression, and decentralized user-generated content features, ensuring mobile titles remain competitive with traditional gaming platforms.'
      }
    },

    // Position 12: Callout / Key Takeaway
    {
      articleId: article.id,
      blockType: 'callout',
      position: 12,
      content: {
        variant: 'tip',
        title: '2026 Mobile Benchmark Key Takeaway',
        text: 'Live-service agility, multi-tier monetization, and high-frequency content drops remain the defining characteristics separating multi-year global blockbusters from transient seasonal hits.'
      }
    },

    // Position 13: Heading FAQ
    {
      articleId: article.id,
      blockType: 'heading',
      position: 13,
      content: {
        level: 2,
        text: 'Frequently Asked Questions (FAQ)'
      }
    },

    // Position 14: FAQ Q&A Paragraph with clean semantic formatting
    {
      articleId: article.id,
      blockType: 'paragraph',
      position: 14,
      content: {
        html: `
          <div class="space-y-6 my-4">
            <div class="p-5 rounded-2xl bg-paper border border-paper-border/80">
              <h4 class="font-bold text-ink-darkest text-base mb-1.5">What are the most popular mobile games worldwide in 2026?</h4>
              <p class="text-ink-muted text-sm sm:text-base leading-relaxed">In 2026, the most popular mobile games include Free Fire, PUBG Mobile, Roblox, and Genshin Impact, each maintaining hundreds of millions of active monthly users across global app stores.</p>
            </div>
            <div class="p-5 rounded-2xl bg-paper border border-paper-border/80">
              <h4 class="font-bold text-ink-darkest text-base mb-1.5">Which mobile game earns the highest revenue in 2026?</h4>
              <p class="text-ink-muted text-sm sm:text-base leading-relaxed">Honor of Kings and Roblox continue to dominate worldwide gross revenue, powered by robust in-app microtransactions, custom digital assets, and seasonal battle pass tiers.</p>
            </div>
            <div class="p-5 rounded-2xl bg-paper border border-paper-border/80">
              <h4 class="font-bold text-ink-darkest text-base mb-1.5">Can these widely played games be played on budget mobile devices in 2026?</h4>
              <p class="text-ink-muted text-sm sm:text-base leading-relaxed">Yes. Titles like Free Fire and PUBG Mobile (via Lite and optimized resource packs) are engineered to scale smoothly across entry-level and mid-range Android hardware.</p>
            </div>
            <div class="p-5 rounded-2xl bg-paper border border-paper-border/80">
              <h4 class="font-bold text-ink-darkest text-base mb-1.5">Are modern widely played mobile games safe for kids?</h4>
              <p class="text-ink-muted text-sm sm:text-base leading-relaxed">Major mobile titles provide parental control dashboards, chat filtering, and spending limits. Platforms like Roblox offer dedicated age-gating and curated experience ratings.</p>
            </div>
            <div class="p-5 rounded-2xl bg-paper border border-paper-border/80">
              <h4 class="font-bold text-ink-darkest text-base mb-1.5">What is the secret behind the long life of top mobile games in 2026?</h4>
              <p class="text-ink-muted text-sm sm:text-base leading-relaxed">Continuous live-service updates, competitive ranked seasons, global esports tournaments, and active player community engagement ensure multi-year player retention.</p>
            </div>
          </div>
        `
      }
    },

    // Position 15: Heading Conclusion
    {
      articleId: article.id,
      blockType: 'heading',
      position: 15,
      content: {
        level: 2,
        text: 'Conclusion'
      }
    },

    // Position 16: Paragraph Conclusion
    {
      articleId: article.id,
      blockType: 'paragraph',
      position: 16,
      content: {
        text: 'The mobile gaming industry in 2026 remains a dynamic and high-growth sector. As hardware advances and network connectivity becomes faster and more accessible, mobile games will continue to blur the lines between mobile and console-quality experiences. The games highlighted in this comparison represent the pinnacle of current mobile entertainment, setting the benchmark for the next generation of mobile development.'
      }
    }
  ];

  await prisma.articleBlock.createMany({
    data: blocksData
  });
  console.log(`✅ ${blocksData.length} Structured article blocks inserted successfully.`);

  console.log('🎉 Ingestion complete!');
  console.log(`🔗 Article URL: http://localhost:5173/rf/gaming/${articleSlug}`);
}

seedMobileGamesArticle()
  .catch((err) => {
    console.error('❌ Ingestion failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
