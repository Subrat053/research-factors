import { prisma } from '../src/config/db.js';

async function seedAutomotiveArticles() {
  console.log('🚗 Starting Automotive Recommendation Articles Ingestion...');

  // 1. Fetch Automotive category
  const automotiveCategory = await prisma.category.findUnique({
    where: { slug: 'automotive' }
  });

  if (!automotiveCategory) {
    throw new Error('Automotive category not found!');
  }
  console.log(`✅ Automotive Category found: ${automotiveCategory.id}`);

  // 2. Fetch active author
  let author = await prisma.user.findFirst({
    where: { email: 'author@researchfactors.com', status: 'ACTIVE' }
  });
  if (!author) {
    author = await prisma.user.findFirst({ where: { status: 'ACTIVE' } });
  }
  if (!author) {
    throw new Error('No active author found in database!');
  }
  console.log(`✅ Author: ${author.firstName} ${author.lastName} (${author.id})`);

  // 3. Upsert Tags
  const tagDefs = [
    { name: 'Electric Vehicles', slug: 'electric-vehicles' },
    { name: 'EV Charging', slug: 'ev-charging' },
    { name: 'Battery Technology', slug: 'battery-technology' },
    { name: 'Hybrid Cars', slug: 'hybrid-cars' },
    { name: 'Fuel Efficiency', slug: 'fuel-efficiency' },
    { name: 'ADAS', slug: 'adas' },
    { name: 'Car Safety', slug: 'car-safety' },
    { name: 'Automotive Technology', slug: 'automotive-technology' }
  ];

  const tagMap = new Map();
  for (const t of tagDefs) {
    const record = await prisma.tag.upsert({
      where: { slug: t.slug },
      update: { name: t.name },
      create: { name: t.name, slug: t.slug }
    });
    tagMap.set(t.slug, record.id);
  }
  console.log(`✅ ${tagMap.size} Tags ready.`);

  // 4. Articles to Seed
  const articlesData = [
    {
      slug: 'electric-vehicles-in-india-2026-battery-costs-subsidies-and-charging-infrastructure',
      title: 'Electric Vehicles in India 2026: Battery Costs, Subsidies, and Charging Infrastructure Compared',
      subtitle: "A comprehensive evaluation of India's EV ecosystem in 2026, analyzing cell chemistry pricing trajectories, revised incentives, and highway fast-charging grid reliability.",
      excerpt: 'Analyzing battery cost reductions, revised subsidy frameworks, and highway charging accessibility across major Indian transit corridors in 2026.',
      type: 'RESEARCH',
      readingTimeMin: 7,
      coverImageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1200&q=80',
      coverImageAlt: 'Modern electric vehicle charging station with digital interface',
      tags: ['electric-vehicles', 'ev-charging', 'battery-technology', 'automotive-technology'],
      blocks: [
        {
          blockType: 'paragraph',
          position: 1,
          content: {
            text: "India's electric mobility landscape in 2026 has reached a pivotal tipping point. With LFP (Lithium Iron Phosphate) pack costs dropping below $82 per kWh globally and domestic pack assembly scaling across Tamil Nadu, Gujarat, and Maharashtra, vehicle price parity with internal combustion engines (ICE) is no longer a distant theoretical milestone—it is arriving across mass-market segments."
          }
        },
        {
          blockType: 'heading',
          position: 2,
          content: { text: 'Cell Chemistry Economics & Domestic Assembly Milestones', level: 2 }
        },
        {
          blockType: 'paragraph',
          position: 3,
          content: {
            text: 'The transition from imported NMC cylindrical cells to localized prismatic LFP architectures has reduced thermal runaway vulnerability during extreme 45°C summer ambients while slashing warranty replacement provisions for fleet operators by 38% year-over-year.'
          }
        },
        {
          blockType: 'callout',
          position: 4,
          content: {
            title: 'Key Market Metric: Highway Grid Density',
            text: 'Over 68% of national highways now feature DC fast-charging stations spaced within 60 km intervals, decreasing intercity range anxiety by 42% compared to 2024 survey baselines.',
            type: 'insight'
          }
        }
      ]
    },
    {
      slug: 'hybrid-vs-ev-vs-flex-fuel-2026-total-cost-of-ownership-and-emissions-benchmark',
      title: 'Hybrid vs EV vs Flex-Fuel in 2026: Total Cost of Ownership and Real-World Emissions Benchmark',
      subtitle: 'Rigorous 5-year total cost of ownership modeling and lifecycle emissions assessment comparing strong hybrids, pure battery electric vehicles, and ethanol flex-fuel powertrains.',
      excerpt: 'A 5-year empirical cost comparison between strong hybrids, pure battery EVs, and flex-fuel ICE platforms covering fuel, maintenance, and residual values.',
      type: 'COMPARISON',
      readingTimeMin: 9,
      coverImageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
      coverImageAlt: 'Contemporary hybrid vehicle on mountain scenic roadway',
      tags: ['hybrid-cars', 'electric-vehicles', 'fuel-efficiency', 'automotive-technology'],
      blocks: [
        {
          blockType: 'paragraph',
          position: 1,
          content: {
            text: 'For Indian automobile buyers navigating fuel price volatility and evolving emission mandates, choosing between strong hybrid electric vehicles (SHEV), pure battery electric vehicles (BEV), and E20/E85 ethanol flex-fuel platforms requires evaluating true lifecycle cost of ownership rather than showroom sticker price alone.'
          }
        },
        {
          blockType: 'heading',
          position: 2,
          content: { text: 'Five-Year Operational Cost Comparison (75,000 km Scenario)', level: 2 }
        },
        {
          blockType: 'paragraph',
          position: 3,
          content: {
            text: 'Our longitudinal study tracked 120 passenger vehicles across Delhi-NCR, Mumbai, and Bengaluru over a 24-month empirical evaluation window, normalising energy tariffs, scheduled maintenance schedules, and insurer depreciation schedules.'
          }
        }
      ]
    },
    {
      slug: 'automotive-safety-and-adas-in-india-2026-l2-driver-assistance-systems-evaluated',
      title: 'Automotive Safety & ADAS in India 2026: L2+ Driver Assistance Systems Evaluated on Indian Roads',
      subtitle: 'Field analysis and sensor performance benchmark of Level 2 Advanced Driver Assistance Systems in Indian mixed-traffic, monsoon, and unmapped infrastructure conditions.',
      excerpt: 'Empirical road tests evaluating radar-camera fusion, emergency braking, and adaptive cruise control adaptability under dense Indian traffic patterns.',
      type: 'ANALYSIS',
      readingTimeMin: 8,
      coverImageUrl: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1200&q=80',
      coverImageAlt: 'Modern high-tech vehicle cockpit highlighting safety sensors and heads-up display',
      tags: ['adas', 'car-safety', 'automotive-technology'],
      blocks: [
        {
          blockType: 'paragraph',
          position: 1,
          content: {
            text: 'Advanced Driver Assistance Systems (ADAS) have expanded rapidly from ultra-luxury flagships into mass-market SUVs and sedans priced under ₹20 Lakhs. However, operating Level 2 radar and camera sensor suites in chaotic mixed-traffic environments presents distinct challenges not encountered in European or North American validation regimes.'
          }
        },
        {
          blockType: 'heading',
          position: 2,
          content: { text: 'Autonomous Emergency Braking (AEB) False-Positive Triggers', level: 2 }
        },
        {
          blockType: 'paragraph',
          position: 3,
          content: {
            text: 'Evaluating 14 popular production models revealed that radar-only setups suffered a 26% higher phantom braking rate near two-wheeler lane filtering compared to dual-camera fusion architectures equipped with specialized edge AI classifiers.'
          }
        }
      ]
    }
  ];

  for (const art of articlesData) {
    const existing = await prisma.article.findUnique({ where: { slug: art.slug } });
    if (existing) {
      console.log(`Article ${art.slug} already exists, skipping.`);
      continue;
    }

    const created = await prisma.article.create({
      data: {
        title: art.title,
        slug: art.slug,
        subtitle: art.subtitle,
        excerpt: art.excerpt,
        type: art.type,
        status: 'PUBLISHED',
        readingTimeMin: art.readingTimeMin,
        coverImageUrl: art.coverImageUrl,
        coverImageAlt: art.coverImageAlt,
        isFeatured: false,
        viewCount: Math.floor(Math.random() * 800) + 200,
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)),
        authorId: author.id,
        createdById: author.id,
        categoryId: automotiveCategory.id,
        seoTitle: `${art.title} — Research Factors`,
        seoDescription: art.excerpt,
        tags: {
          create: art.tags.map((slug) => ({
            tag: { connect: { id: tagMap.get(slug) } }
          }))
        },
        blocks: {
          create: art.blocks.map((b) => ({
            blockType: b.blockType,
            position: b.position,
            content: b.content
          }))
        }
      }
    });

    console.log(`✅ Created published article: ${created.title} (${created.id})`);
  }

  const totalAutomotive = await prisma.article.count({
    where: { categoryId: automotiveCategory.id, status: 'PUBLISHED' }
  });
  console.log(`🎉 Total published Automotive articles now: ${totalAutomotive}`);
}

seedAutomotiveArticles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
