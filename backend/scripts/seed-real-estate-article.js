import { prisma } from '../src/config/db.js';

async function seedRealEstateArticle() {
  console.log('🚀 Starting Real Estate Article Ingestion...');

  // 1. Upsert Parent Category: Business
  const businessCategory = await prisma.category.upsert({
    where: { slug: 'business' },
    update: {
      name: 'Business',
      description: 'Capital allocation, enterprise software unit economics, industrial supply chains, and market structures.',
      isActive: true,
      showInFooter: true,
      seoTitle: 'Business Research, Analysis & Comparative Studies — Research Factors',
      seoDescription: 'Capital allocation, enterprise software unit economics, industrial supply chains, and market structures.'
    },
    create: {
      name: 'Business',
      slug: 'business',
      description: 'Capital allocation, enterprise software unit economics, industrial supply chains, and market structures.',
      isActive: true,
      showInFooter: true,
      seoTitle: 'Business Research, Analysis & Comparative Studies — Research Factors',
      seoDescription: 'Capital allocation, enterprise software unit economics, industrial supply chains, and market structures.'
    }
  });
  console.log(`✅ Parent Category 'Business' ready: ${businessCategory.id}`);

  // 2. Upsert Subcategory: Real Estate (Child of Business)
  const realEstateCategory = await prisma.category.upsert({
    where: { slug: 'real-estate' },
    update: {
      name: 'Real Estate',
      description: 'Empirical research, housing economics, commercial real estate analytics, property valuation, and macroeconomic investment trends.',
      isActive: true,
      showInFooter: true,
      parentId: businessCategory.id,
      seoTitle: 'Real Estate Research, Market Trends & Investment Analysis | Research Factors',
      seoDescription: 'In-depth empirical research on residential and commercial real estate, REITs, housing market indicators, and macroeconomic property investment trends.'
    },
    create: {
      name: 'Real Estate',
      slug: 'real-estate',
      description: 'Empirical research, housing economics, commercial real estate analytics, property valuation, and macroeconomic investment trends.',
      isActive: true,
      showInFooter: true,
      parentId: businessCategory.id,
      seoTitle: 'Real Estate Research, Market Trends & Investment Analysis | Research Factors',
      seoDescription: 'In-depth empirical research on residential and commercial real estate, REITs, housing market indicators, and macroeconomic property investment trends.'
    }
  });
  console.log(`✅ Subcategory 'Real Estate' ready (parent: Business): ${realEstateCategory.id}`);

  // 3. Upsert the 8 Topic Tags
  const tagDefinitions = [
    { name: 'Real Estate Investment', slug: 'real-estate-investment' },
    { name: 'Real Estate Market Trends', slug: 'real-estate-market-trends' },
    { name: 'Commercial Real Estate', slug: 'commercial-real-estate' },
    { name: 'Residential Real Estate', slug: 'residential-real-estate' },
    { name: 'REITs', slug: 'reits' },
    { name: 'Property Investment', slug: 'property-investment' },
    { name: 'Real Estate Market Analysis', slug: 'real-estate-market-analysis' },
    { name: 'Real Estate Investment Decision', slug: 'real-estate-investment-decision' }
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

  // 4. Find an active author
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

  // 5. Upsert the Article
  const articleSlug = 'when-is-investing-in-real-estate-a-wise-decision-in-2026-a-comprehensive-guide';
  const article = await prisma.article.upsert({
    where: { slug: articleSlug },
    update: {
      title: 'When Is Investing in Real Estate a Wise Decision in 2026? A Comprehensive Guide',
      subtitle: 'An exhaustive evaluation of real estate investment conditions in 2026, analyzing interest rate trajectories, macroeconomic indicators, property types, risk mitigation strategies, and ROI optimization.',
      excerpt: 'Real estate has long been regarded as one of the most reliable and tangible investment vehicles, capable of delivering steady cash flow, tax advantages, and long-term capital appreciation. In 2026, evolving interest rates and demographic shifts make timing and market selection more crucial than ever.',
      coverImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200&auto=format&fit=crop',
      coverImageAlt: 'Professional reviewing property contract documents with a miniature model house on desk',
      type: 'GUIDE',
      status: 'PUBLISHED',
      readingTimeMin: 8,
      viewCount: 142,
      isFeatured: true,
      isSponsored: true,
      sponsorName: 'Gharabadi Realty',
      sponsorDescription: 'Connect with Gharabadi Realty today and take the next step toward building long-term wealth through strategic property investments.',
      sponsorUrl: 'https://gharabadi.com',
      sponsorLogoUrl: null,
      categoryId: realEstateCategory.id,
      authorId: author.id,
      createdById: author.id,
      publishedById: author.id,
      publishedAt: new Date('2026-09-27T09:00:00.000Z'),
      seoTitle: 'When Is Investing in Real Estate a Wise Decision in 2026? A Comprehensive Guide | Research Factors',
      seoDescription: 'Empirical guide analyzing real estate investment conditions in 2026. Explore key indicators, market dynamics, property types, risk mitigation, and ROI optimization.',
      canonicalUrl: `https://researchfactors.com/real-estate/${articleSlug}`
    },
    create: {
      title: 'When Is Investing in Real Estate a Wise Decision in 2026? A Comprehensive Guide',
      slug: articleSlug,
      subtitle: 'An exhaustive evaluation of real estate investment conditions in 2026, analyzing interest rate trajectories, macroeconomic indicators, property types, risk mitigation strategies, and ROI optimization.',
      excerpt: 'Real estate has long been regarded as one of the most reliable and tangible investment vehicles, capable of delivering steady cash flow, tax advantages, and long-term capital appreciation. In 2026, evolving interest rates and demographic shifts make timing and market selection more crucial than ever.',
      coverImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200&auto=format&fit=crop',
      coverImageAlt: 'Professional reviewing property contract documents with a miniature model house on desk',
      type: 'GUIDE',
      status: 'PUBLISHED',
      readingTimeMin: 8,
      viewCount: 142,
      isFeatured: true,
      isSponsored: true,
      sponsorName: 'Gharabadi Realty',
      sponsorDescription: 'Connect with Gharabadi Realty today and take the next step toward building long-term wealth through strategic property investments.',
      sponsorUrl: 'https://gharabadi.com',
      sponsorLogoUrl: null,
      categoryId: realEstateCategory.id,
      authorId: author.id,
      createdById: author.id,
      publishedById: author.id,
      publishedAt: new Date('2026-09-27T09:00:00.000Z'),
      seoTitle: 'When Is Investing in Real Estate a Wise Decision in 2026? A Comprehensive Guide | Research Factors',
      seoDescription: 'Empirical guide analyzing real estate investment conditions in 2026. Explore key indicators, market dynamics, property types, risk mitigation, and ROI optimization.',
      canonicalUrl: `https://researchfactors.com/real-estate/${articleSlug}`
    }
  });
  console.log(`✅ Article record ready: ${article.id}`);

  // 6. Associate Article Tags
  await prisma.articleTag.deleteMany({
    where: { articleId: article.id }
  });
  await prisma.articleTag.createMany({
    data: tagRecords.map((t) => ({
      articleId: article.id,
      tagId: t.id
    }))
  });
  console.log(`✅ ${tagRecords.length} ArticleTag links established.`);

  // 7. Seed Structured Content Blocks
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
        text: 'Investing in real estate remains one of the most tried-and-true paths to building long-term wealth, providing steady cash flow, tax advantages, and protection against inflation. However, market dynamics evolve constantly, and 2026 presents a unique set of economic conditions—shifting interest rates, fluctuating housing supply, and varying regional growth—that make timing and strategy more critical than ever. Whether you are a first-time homebuyer, an aspiring landlord, or an experienced investor looking to expand your portfolio, knowing when and how to enter the market can mean the difference between strong financial returns and costly missteps.'
      }
    },

    // Position 1: Heading 1
    {
      articleId: article.id,
      blockType: 'heading',
      position: 1,
      content: {
        level: 2,
        text: 'Understanding the Real Estate Market Dynamics in 2026'
      }
    },

    // Position 2: Paragraph 1
    {
      articleId: article.id,
      blockType: 'paragraph',
      position: 2,
      content: {
        text: 'To determine whether investing in real estate is a wise move in 2026, it is essential to first grasp the broader economic landscape. Real estate does not operate in a vacuum; it is shaped by macroeconomic factors including central bank interest rates, inflation figures, employment trends, and housing supply shortages. In 2026, many markets are adjusting to stabilized interest rates following previous periods of rapid tightening, which has begun to re-energize buyer demand while keeping inventory constrained in high-demand metropolitan and suburban corridors.'
      }
    },

    // Position 3: Heading 2
    {
      articleId: article.id,
      blockType: 'heading',
      position: 3,
      content: {
        level: 2,
        text: 'Key Indicators That Signal a Wise Real Estate Investment'
      }
    },

    // Position 4: Paragraph with sub-cards for indicators
    {
      articleId: article.id,
      blockType: 'paragraph',
      position: 4,
      content: {
        html: `
          <p class="mb-4">Before committing capital, look for these foundational market indicators that signal favorable investment conditions:</p>
          <div class="space-y-4 my-4">
            <div class="p-5 rounded-2xl bg-white border border-paper-border shadow-xs">
              <h4 class="text-base sm:text-lg font-bold text-ink-darkest">1. Stable or Low Interest Rates</h4>
              <p class="text-base sm:text-lg text-ink-muted mt-1.5 leading-relaxed">Favorable borrowing costs enhance affordability, improve monthly cash flow margins for leveraged acquisitions, and expand the pool of qualified buyers and tenants.</p>
            </div>
            <div class="p-5 rounded-2xl bg-white border border-paper-border shadow-xs">
              <h4 class="text-base sm:text-lg font-bold text-ink-darkest">2. Favorable Demographic Trends</h4>
              <p class="text-base sm:text-lg text-ink-muted mt-1.5 leading-relaxed">Population influx, corporate relocations, and rising household formations drive sustained rental demand and upward pressure on property values.</p>
            </div>
            <div class="p-5 rounded-2xl bg-white border border-paper-border shadow-xs">
              <h4 class="text-base sm:text-lg font-bold text-ink-darkest">3. Strong Local Economic Growth</h4>
              <p class="text-base sm:text-lg text-ink-muted mt-1.5 leading-relaxed">Regions with diversified job markets, low unemployment rates, and continuous infrastructure investments demonstrate stronger resilience and property appreciation over time.</p>
            </div>
            <div class="p-5 rounded-2xl bg-white border border-paper-border shadow-xs">
              <h4 class="text-base sm:text-lg font-bold text-ink-darkest">4. Diversification from Other Asset Classes</h4>
              <p class="text-base sm:text-lg text-ink-muted mt-1.5 leading-relaxed">Real estate offers low correlation with volatile equity markets and tangible collateral value, providing a dependable hedge against broader macroeconomic uncertainty.</p>
            </div>
          </div>
        `
      }
    },

    // Position 5: Heading 3
    {
      articleId: article.id,
      blockType: 'heading',
      position: 5,
      content: {
        level: 2,
        text: 'Types of Real Estate Investments to Consider in 2026'
      }
    },

    // Position 6: Paragraph with sub-cards for types
    {
      articleId: article.id,
      blockType: 'paragraph',
      position: 6,
      content: {
        html: `
          <p class="mb-4">In 2026, several real estate investment pathways offer distinctive risk-reward profiles:</p>
          <div class="space-y-4 my-4">
            <div class="p-5 rounded-2xl bg-white border border-paper-border shadow-xs">
              <h4 class="text-base sm:text-lg font-bold text-ink-darkest">Residential Properties</h4>
              <p class="text-base sm:text-lg text-ink-muted mt-1.5 leading-relaxed">Single-family homes and multi-family duplexes or apartment communities remain consistently resilient, benefiting from perpetual demand for quality housing and steady rental yields.</p>
            </div>
            <div class="p-5 rounded-2xl bg-white border border-paper-border shadow-xs">
              <h4 class="text-base sm:text-lg font-bold text-ink-darkest">Commercial Real Estate</h4>
              <p class="text-base sm:text-lg text-ink-muted mt-1.5 leading-relaxed">Warehousing, logistics hubs, and medical office facilities lead commercial growth, outperforming traditional office spaces in adaptability and long-term lease commitments.</p>
            </div>
            <div class="p-5 rounded-2xl bg-white border border-paper-border shadow-xs">
              <h4 class="text-base sm:text-lg font-bold text-ink-darkest">Real Estate Investment Trusts (REITs)</h4>
              <p class="text-base sm:text-lg text-ink-muted mt-1.5 leading-relaxed">An accessible, liquid alternative allowing investors to participate in large-scale commercial portfolios without the responsibilities of direct property management.</p>
            </div>
          </div>
        `
      }
    },

    // Position 7: Heading 4
    {
      articleId: article.id,
      blockType: 'heading',
      position: 7,
      content: {
        level: 2,
        text: 'Risks and How to Mitigate Them When Investing in Real Estate'
      }
    },

    // Position 8: Paragraph with sub-cards for risks
    {
      articleId: article.id,
      blockType: 'paragraph',
      position: 8,
      content: {
        html: `
          <p class="mb-4">Despite its enduring appeal, real estate investing carries inherent risks that require disciplined risk management:</p>
          <div class="space-y-4 my-4">
            <div class="p-4 rounded-xl bg-white border border-paper-border/80 shadow-2xs">
              <h4 class="text-sm font-semibold text-ink-darkest">Market Volatility</h4>
              <p class="text-xs sm:text-sm text-ink-muted mt-1.5 leading-relaxed">Local property values can decline due to broader economic downturns or localized industry contractions. <em>Mitigation:</em> Focus on prime locations and long-term hold horizons.</p>
            </div>
            <div class="p-4 rounded-xl bg-white border border-paper-border/80 shadow-2xs">
              <h4 class="text-sm font-semibold text-ink-darkest">Illiquidity</h4>
              <p class="text-xs sm:text-sm text-ink-muted mt-1.5 leading-relaxed">Unlike stocks, real estate cannot be converted into cash instantly. <em>Mitigation:</em> Maintain adequate liquid emergency reserves before purchasing physical assets.</p>
            </div>
            <div class="p-4 rounded-xl bg-white border border-paper-border/80 shadow-2xs">
              <h4 class="text-sm font-semibold text-ink-darkest">High Upfront Capital</h4>
              <p class="text-xs sm:text-sm text-ink-muted mt-1.5 leading-relaxed">Down payments, closing fees, and reserves require substantial liquidity. <em>Mitigation:</em> Consider partnering with co-investors or exploring REITs for fractional exposure.</p>
            </div>
            <div class="p-4 rounded-xl bg-white border border-paper-border/80 shadow-2xs">
              <h4 class="text-sm font-semibold text-ink-darkest">Property Management Challenges</h4>
              <p class="text-xs sm:text-sm text-ink-muted mt-1.5 leading-relaxed">Tenant vacancies, maintenance repairs, and late payments can erode cash flow. <em>Mitigation:</em> Partner with experienced property managers or reliable local real estate agencies.</p>
            </div>
          </div>
        `
      }
    },

    // Position 9: Heading 5
    {
      articleId: article.id,
      blockType: 'heading',
      position: 9,
      content: {
        level: 2,
        text: 'Maximizing ROI: Best Practices for Real Estate Investment in 2026'
      }
    },

    // Position 10: Paragraph with sub-cards for best practices
    {
      articleId: article.id,
      blockType: 'paragraph',
      position: 10,
      content: {
        html: `
          <p class="mb-4">To achieve superior risk-adjusted returns, apply these proven investor disciplines:</p>
          <div class="space-y-4 my-4">
            <div class="p-4 rounded-xl bg-white border border-paper-border/80 shadow-2xs">
              <h4 class="text-sm font-semibold text-ink-darkest">Do Thorough Due Diligence</h4>
              <p class="text-xs sm:text-sm text-ink-muted mt-1.5 leading-relaxed">Analyze neighborhood comps, historical vacancy rates, property condition reports, and local municipal zoning ordinances thoroughly before submitting an offer.</p>
            </div>
            <div class="p-4 rounded-xl bg-white border border-paper-border/80 shadow-2xs">
              <h4 class="text-sm font-semibold text-ink-darkest">Leverage Financing Responsibly</h4>
              <p class="text-xs sm:text-sm text-ink-muted mt-1.5 leading-relaxed">Keep debt service coverage ratios healthy and avoid over-leveraging, ensuring cash flows remain resilient even during temporary vacancy cycles.</p>
            </div>
            <div class="p-4 rounded-xl bg-white border border-paper-border/80 shadow-2xs">
              <h4 class="text-sm font-semibold text-ink-darkest">Focus on Long-Term Appreciation</h4>
              <p class="text-xs sm:text-sm text-ink-muted mt-1.5 leading-relaxed">The greatest real estate wealth is built through multi-year equity compounding, amortization, and gradual market value appreciation.</p>
            </div>
            <div class="p-4 rounded-xl bg-white border border-paper-border/80 shadow-2xs">
              <h4 class="text-sm font-semibold text-ink-darkest">Diversify Geographically and Across Property Types</h4>
              <p class="text-xs sm:text-sm text-ink-muted mt-1.5 leading-relaxed">Spread investments across different sub-markets or property types to protect against localized micro-market downturns.</p>
            </div>
          </div>
        `
      }
    },

    // Position 11: Heading 6
    {
      articleId: article.id,
      blockType: 'heading',
      position: 11,
      content: {
        level: 2,
        text: 'How Gharabadi Realty Can Support Your Real Estate Investment Journey'
      }
    },

    // Position 12: Paragraph 6
    {
      articleId: article.id,
      blockType: 'paragraph',
      position: 12,
      content: {
        text: 'Navigating complex property valuations, emerging neighborhood corridors, and transactional paperwork requires deep, boots-on-the-ground expertise. Having a trusted advisor by your side can help you avoid costly mistakes and identify off-market opportunities with exceptional upside potential. Whether you are looking for high-yield residential rentals or prime commercial real estate, working with an experienced realty partner ensures you make data-driven, confident decisions tailored to your financial goals.'
      }
    },

    // Position 13: Sponsored Section Card
    {
      articleId: article.id,
      blockType: 'paragraph',
      position: 13,
      content: {
        html: `
          <div class="my-8 p-6 sm:p-7 rounded-2xl bg-[#fdf8f4] border border-[#f3ddcd] shadow-xs space-y-3">
            <h3 class="font-serif text-xl sm:text-2xl font-bold text-ink-darkest leading-snug">Sponsored Section</h3>
            <p class="text-xs sm:text-sm text-ink-muted leading-relaxed">Looking for a trustworthy real estate partner in 2026? Gharabadi Realty helps you navigate the market with confidence, offering tailored investment opportunities, expert market research, and end-to-end guidance to maximize your returns. Connect with Gharabadi Realty today and take the next step toward building long-term wealth through strategic property investments.</p>
            <div class="pt-2">
              <a href="https://gharabadi.com" target="_blank" rel="noopener noreferrer sponsored" class="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-[#a94f29] hover:bg-[#8f4121] transition-colors shadow-2xs cursor-pointer">
                Visit Sponsor
              </a>
            </div>
          </div>
        `
      }
    },

    // Position 14: Heading FAQ
    {
      articleId: article.id,
      blockType: 'heading',
      position: 14,
      content: {
        level: 2,
        text: 'FAQ'
      }
    },

    // Position 15: Interactive FAQ Accordion Block
    {
      articleId: article.id,
      blockType: 'faq',
      position: 15,
      content: {
        items: [
          {
            question: 'When is a real estate investment considered a good idea?',
            answer: 'A real estate investment is generally considered wise when interest rates are stable or manageable, you have secure financing and emergency reserves, local demographic and economic indicators show steady job and population growth, and your investment horizon spans at least 5 to 10 years to weather short-term market cycles.'
          },
          {
            question: 'What type of real estate investment offers the most consistent returns?',
            answer: 'Multi-family residential properties and industrial logistics facilities typically deliver the most consistent cash flows and returns, driven by essential non-discretionary demand for shelter and supply chain infrastructure across all economic cycles.'
          },
          {
            question: 'How much capital should I have before investing in real estate?',
            answer: 'For direct property ownership, investors typically need at least 20% to 25% down payment for investment mortgages, plus an additional 3% to 6% for closing costs and 6 months of operating reserves. For REITs or syndicated platforms, entry points can be as low as $500 to $5,000.'
          },
          {
            question: 'What are the risks of managing properties without a property manager?',
            answer: 'Self-managing properties exposes investors to compliance and tenant landlord laws, unexpected emergency maintenance demands, higher tenant vacancy rates, and emotional negotiation friction. Hiring a qualified property manager often pays for itself through higher tenant retention and cost-effective maintenance.'
          },
          {
            question: 'How can I tell if a local real estate market is on the rise?',
            answer: 'Key signals of an emerging real estate market include declining average days on market (DOM), rising building permit issuances, inward corporate headquarters relocations, expansion of public transit infrastructure, and sustained median household income growth.'
          }
        ]
      }
    },

    // Position 16: Heading Conclusion
    {
      articleId: article.id,
      blockType: 'heading',
      position: 16,
      content: {
        level: 2,
        text: 'Conclusion'
      }
    },

    // Position 17: Paragraph Conclusion
    {
      articleId: article.id,
      blockType: 'paragraph',
      position: 17,
      content: {
        text: 'Investing in real estate in 2026 can be an exceptionally rewarding decision when approached with discipline, thorough research, and a long-term strategic perspective. By understanding local market dynamics, selecting the right property type for your risk tolerance, and partnering with experienced professionals like Gharabadi Realty, you can build a resilient portfolio that delivers steady income and lasting capital growth for years to come.'
      }
    }
  ];

  await prisma.articleBlock.createMany({
    data: blocksData
  });
  console.log(`✅ ${blocksData.length} Structured article blocks inserted successfully.`);

  console.log('🎉 Ingestion complete!');
  console.log(`🔗 Article URL: http://localhost:5173/real-estate/${articleSlug}`);
}

seedRealEstateArticle()
  .catch((err) => {
    console.error('❌ Ingestion failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
