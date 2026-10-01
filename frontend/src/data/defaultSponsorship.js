/**
 * Default Canonical Sponsorship Packages for Research Factors
 * Used as offline fallback and initial baseline template in Admin System Settings.
 */
export const DEFAULT_SPONSORSHIP_TIERS = [
  {
    id: 'launch-article',
    name: 'Launch Article',
    kicker: 'Starter',
    price: '₹14,999',
    period: 'Single Study Investment',
    description: 'Best for one-time brand visibility and technical awareness with an evidence-led sponsored study or review.',
    features: [
      '1 Sponsored research article or review (up to 1,500 words)',
      '1 Primary category hub directory listing',
      'Full Schema.org JSON-LD & OpenGraph SEO metadata',
      'Transparent commercial disclosure badge',
      'Contextual brand callout box with outbound link',
      '1 Editorial revision & factual verification round',
      'Permanent indexing in universal Research Archive'
    ],
    cta: 'Start With Starter',
    isPopular: false,
    isActive: true
  },
  {
    id: 'authority-series',
    name: 'Authority Series',
    kicker: 'Growth',
    price: '₹34,999',
    period: '3-Part Research Package',
    description: 'Designed for brands seeking compounding search visibility, comparative positioning, and deep category authority.',
    features: [
      '3 Long-form research articles or reviews (up to 2,000 words each)',
      'Priority placement across multiple category hubs',
      'Structured side-by-side comparison matrix integration',
      'Featured placement in Homepage Latest Research section',
      'Dedicated brand CTA card with custom trial/documentation link',
      '2 Editorial revision rounds with direct desk review',
      'Quarterly verified reader engagement summary'
    ],
    cta: 'Choose Growth',
    isPopular: true,
    isActive: true
  },
  {
    id: 'enterprise-benchmark',
    name: 'Enterprise & Benchmark',
    kicker: 'Scale',
    price: '₹74,999',
    period: 'Comprehensive Partnership',
    description: 'For technology leaders and enterprise solutions requiring definitive market leadership and extensive editorial reach.',
    features: [
      'Co-branded Industry Benchmark Report or 6-article series (up to 2,500 words)',
      'Homepage Featured Research Carousel rotation',
      'Executive / engineering interview (Brand Insight Feature)',
      'Cross-category syndication & indexed topic tag network',
      'Priority editorial turnaround with dedicated senior editor',
      'Comprehensive reader engagement & audience analytics dossier',
      'Custom whitepaper or lead generation integration'
    ],
    cta: 'Inquire Enterprise',
    isPopular: false,
    isActive: true
  }
];
