import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { articlesApi } from '../../services/articles.api.js';
import { seoApi } from '../../services/seo.api.js';
import { normalizeMediaUrl } from '../../services/media.api.js';
import { SeoHead } from '../../components/common/SeoHead.jsx';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import { ArticleCard } from '../../components/article/ArticleCard.jsx';
import { FeaturedArticlesCarousel } from '../../components/article/FeaturedArticlesCarousel.jsx';
import { CardSkeleton } from '../../components/feedback/SkeletonLoader.jsx';
import { EmptyState } from '../../components/feedback/EmptyState.jsx';
import {
  BadgeCheck,
  ArrowRight,
  TrendingUp,
  Cpu,
  Briefcase,
  FlaskConical,
  Compass,
  FileText,
  Layers,
  Search,
  CheckCircle2,
  ShieldCheck,
  Award,
  Users,
  Send,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Activity,
  Lightbulb,
  ExternalLink,
  Laptop,
  Target,
  ShoppingBag
} from 'lucide-react';

const sponsorshipContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.5,
      delayChildren: 0.15
    }
  }
};

const cardSlideLeftVariants = {
  hidden: {
    opacity: 0,
    x: -48
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const cardSlideRightVariants = {
  hidden: {
    opacity: 0,
    x: 48
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const cardButtonVariants = {
  hidden: {
    opacity: 0,
    y: 16
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const stepContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.10
    }
  }
};

const stepItemVariants = {
  hidden: {
    opacity: 0,
    y: 18
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const processSteps = [
  {
    step: '01',
    title: 'Research',
    desc: 'We investigate the core problem, gather empirical data, and examine primary source documentation.'
  },
  {
    step: '02',
    title: 'Analyze',
    desc: 'Information is structured, benchmarked against alternatives, and tested across realistic use cases.'
  },
  {
    step: '03',
    title: 'Publish',
    desc: 'Findings are presented in clean, scannable layouts with clear decision summaries and tables.'
  },
  {
    step: '04',
    title: 'Discuss',
    desc: 'Readers, verified authors, and industry practitioners add community perspectives and real feedback.'
  }
];

function StatCounter({ end, decimals = 0, suffix = '', duration = 2000 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTime = null;
          let rafId;

          const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = easeOut * end;
            setValue(current);

            if (progress < 1) {
              rafId = requestAnimationFrame(step);
            } else {
              setValue(end);
            }
          };

          rafId = requestAnimationFrame(step);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  const displayValue = decimals > 0 
    ? value.toFixed(decimals) 
    : Math.floor(value).toLocaleString();

  return (
    <span ref={ref} className="tabular-nums">
      {displayValue}{suffix}
    </span>
  );
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // 0. Fetch Resolved Page SEO
  const { data: seoResponse } = useQuery({
    queryKey: ['seo', 'page', 'home'],
    queryFn: () => seoApi.resolveSeo({ type: 'PAGE', id: 'home' }),
    staleTime: 1000 * 60 * 10
  });
  const pageSeo = seoResponse?.data || null;

  // 1. Fetch Featured Article
  const { data: featuredData, isLoading: isFeaturedLoading } = useQuery({
    queryKey: ['featured-article'],
    queryFn: () => articlesApi.getFeaturedArticle()
  });

  // 2. Fetch Published Articles
  const { data: articlesData, isLoading: isArticlesLoading } = useQuery({
    queryKey: ['articles', { category: selectedCategory }],
    queryFn: () => articlesApi.getArticles({ limit: 8, category: selectedCategory })
  });

  // 3. Fetch Trending Articles (powers Hero Trending Today 1-5 list & Trending section)
  const { data: trendingData, isLoading: isTrendingLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: () => articlesApi.getTrending()
  });

  // 4. Fetch Categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => articlesApi.getCategories()
  });

  const articles = articlesData?.data?.items || [];
  const trending = trendingData?.data || [];
  const categories = categoriesData?.data || [];
  const featuredArticle = featuredData?.data || articles[0] || null;

  // Derive pool of articles for the Featured Research 3-card carousel
  const carouselArticles = React.useMemo(() => {
    const pool = [];
    if (featuredData?.data) {
      pool.push(featuredData.data);
    }
    if (Array.isArray(articles)) {
      articles.forEach((art) => {
        if (!pool.some((p) => p.id === art.id)) {
          pool.push(art);
        }
      });
    }
    return pool;
  }, [featuredData, articles]);

  // Icon dictionary mapping categories by slug/keyword to high-contrast Lucide icons
  const CATEGORY_ICON_MAP = {
    technology: Cpu,
    tech: Cpu,
    software: Laptop,
    science: FlaskConical,
    physics: FlaskConical,
    policy: BookOpen,
    governance: BookOpen,
    economics: TrendingUp,
    finance: TrendingUp,
    business: Briefcase,
    lifestyle: ShoppingBag,
    health: Activity,
    default: Layers
  };

  const getCategoryIcon = (slug, name) => {
    const key = `${slug || ''} ${name || ''}`.toLowerCase();
    for (const [k, icon] of Object.entries(CATEGORY_ICON_MAP)) {
      if (k !== 'default' && key.includes(k)) return icon;
    }
    return CATEGORY_ICON_MAP.default;
  };

  // Curated fallback topics with matching uni-color icons and descriptions
  const defaultTopicCards = [
    {
      name: 'Technology',
      slug: 'technology',
      desc: 'Gadgets, Software, AI & Semiconductors',
      icon: Cpu,
      articleCount: 13
    },
    {
      name: 'Business',
      slug: 'business',
      desc: 'Markets, Startups, Strategy & Finance',
      icon: Briefcase,
      articleCount: 'Explore'
    },
    {
      name: 'Lifestyle',
      slug: 'lifestyle',
      desc: 'Health, Travel, Food & Daily Choices',
      icon: ShoppingBag,
      articleCount: 'Explore'
    },
    {
      name: 'Science',
      slug: 'science',
      desc: 'Space, Nature, Discoveries & Research',
      icon: FlaskConical,
      articleCount: 1
    },
    {
      name: 'Policy',
      slug: 'policy',
      desc: 'Governance, Law, Global Policy & Economics',
      icon: BookOpen,
      articleCount: 1
    }
  ];

  // Dynamic topics: actively driven by database categories, gracefully falling back to defaults
  const displayTopics = React.useMemo(() => {
    const activeDbCategories = Array.isArray(categories)
      ? categories.filter((c) => c.isActive !== false)
      : [];

    if (activeDbCategories.length > 0) {
      return activeDbCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        desc: c.description || `Empirical analysis, benchmarks, and research in ${c.name}.`,
        icon: getCategoryIcon(c.slug, c.name),
        articleCount: c._count?.articles ?? 0
      }));
    }

    return defaultTopicCards;
  }, [categories]);

  // Reader Testimonials (4 items for even count)
  const testimonials = [
    {
      quote:
        'Research Factors is my go-to source for reliable, well-researched comparisons. It helps our team make informed technology decisions without marketing hype.',
      author: 'Marcus Aurelius Vance',
      role: 'Chief Technology Officer'
    },
    {
      quote:
        'The depth and peer-reviewed clarity of comparisons here is unmatched. It feels like an elite academic journal tailored for industry decision-makers.',
      author: 'Dr. Aris Thorne',
      role: 'VP of Research'
    },
    {
      quote:
        'In a media landscape drowning in shallow summaries, Research Factors delivers genuine depth, clear methodology, and transparent disclosures.',
      author: 'Elena Rostova',
      role: 'Managing Director'
    },
    {
      quote:
        'The structured reviews and reproducible benchmarks have saved our engineering leadership months of preliminary evaluation time.',
      author: 'Kavita Ramamurthy',
      role: 'Principal Systems Architect'
    }
  ];

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
    }
  };

  // Testimonial Swipe Gesture Handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance) {
      setTestimonialIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    } else if (distance < -minSwipeDistance) {
      setTestimonialIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    }
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    touchStartX.current = e.clientX;
    touchEndX.current = e.clientX;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    touchEndX.current = e.clientX;
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance) {
      setTestimonialIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    } else if (distance < -minSwipeDistance) {
      setTestimonialIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    }
  };

  const handleMouseLeave = () => {
    if (isDragging.current) {
      isDragging.current = false;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      {/* Production-Grade Dynamic SEO & Schema.org Graph */}
      <SeoHead
        seo={pageSeo}
        title="Research Factors — Empirical Research, Product Comparisons & Editorial Insights"
        description="Explore in-depth research, product comparisons, industry analysis, and expert perspectives across technology, business, science, lifestyle, and more."
      />

      <Header />

      <main className="flex-1">
        {/* 1. HERO SECTION (Reference Mock-up 3-Column Flow) */}
        <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-paper-border bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Headline, Copy & Qualitative Trust Points */}
              <div className="lg:col-span-5 space-y-6">
                {/* Small Badge */}
                <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-rfblue-50 text-rfblue border border-rfblue-100 shadow-2xs">
                  <BadgeCheck className="w-4 h-4 text-rfblue" />
                  <span>Trusted Research. Informed Decisions.</span>
                </div>

                {/* Primary Editorial Heading */}
                <h1 className="text-ink-darkest">
                  Real Research. Smarter Choices.
                </h1>

                {/* Supporting Text */}
                <p className="text-lead text-base sm:text-lg lg:text-xl">
                  Explore in-depth articles, comparisons, and expert insights on products, technologies, companies, and
                  more — all in one place.
                </p>

                {/* Hero Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <a
                    href="#latest-research"
                    className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm sm:text-base font-semibold text-white bg-rfblue hover:bg-rfblue-700 shadow-xs transition-all"
                  >
                    <span>Explore Latest Articles</span>
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </a>
                  <a
                    href="#topics"
                    className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm sm:text-base font-semibold text-ink bg-paper hover:bg-paper-warm border border-paper-border transition-colors"
                  >
                    Browse Categories
                  </a>
                </div>

                {/* Trust Points (Qualitative Trust Signals with Uni-Color Slate Icons) */}
                <div className="pt-6 border-t border-paper-border/80 grid grid-cols-3 gap-4 text-left">
                  <div>
                    <div className="flex items-center space-x-2 text-sm sm:text-base font-bold text-ink-darkest mb-1">
                      <Users className="w-4 h-4 text-slate-700 shrink-0" />
                      <span>Expert Written</span>
                    </div>
                    <p className="text-xs sm:text-sm text-ink-muted leading-snug">By industry specialists</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 text-sm sm:text-base font-bold text-ink-darkest mb-1">
                      <Activity className="w-4 h-4 text-slate-700 shrink-0" />
                      <span>Data Backed</span>
                    </div>
                    <p className="text-xs sm:text-sm text-ink-muted leading-snug">With empirical research</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 text-sm sm:text-base font-bold text-ink-darkest mb-1">
                      <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0" />
                      <span>Unbiased</span>
                    </div>
                    <p className="text-xs sm:text-sm text-ink-muted leading-snug">No brand bias, just facts</p>
                  </div>
                </div>
              </div>

              {/* Center Column: High-Res Researcher Photo with Floating Glass Badges */}
              <div className="lg:col-span-4 relative flex items-center justify-center">
                <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-md border border-paper-border aspect-[4/5] sm:aspect-[3/4]">
                  <img
                    src={normalizeMediaUrl('/images/hero_researcher.jpg')}
                    alt="Research Factors Editorial Analyst"
                    className="w-full h-full object-cover object-center"
                  />
                  {/* Floating Glass Badge 1: Top Right */}
                  <div className="absolute top-4 right-4 glass-card rounded-xl p-3.5 shadow-md border border-white/70 max-w-[210px]">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-7 h-7 rounded-md bg-rfblue-50 text-rfblue flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4 text-rfblue" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-ink-darkest">In-depth Analysis</span>
                    </div>
                    <p className="text-xs text-ink-muted leading-tight">Compare. Understand. Decide.</p>
                  </div>

                  {/* Floating Glass Badge 2: Bottom Left */}
                  <div className="absolute bottom-4 left-4 glass-card rounded-xl p-3.5 shadow-md border border-white/70 max-w-[210px]">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-7 h-7 rounded-md bg-rfblue-50 text-rfblue flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4 text-rfblue" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-ink-darkest">Expert Insights</span>
                    </div>
                    <p className="text-xs  leading-tight">From industry specialists</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Trending Today Ranked 1-5 List */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-xl border border-paper-border p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-paper-border">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-rfblue" />
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-darkest">Trending Today</h3>
                    </div>
                    <Link to="/research?sort=popular" className="text-xs sm:text-sm font-semibold text-rfblue hover:underline">
                      All
                    </Link>
                  </div>

                  <div className="divide-y text-ink-muted divide-paper-border/60">
                    {isTrendingLoading ? (
                      <div className="space-y-3.5 py-2 animate-pulse">
                        <div className="h-12 bg-paper-border/50 rounded" />
                        <div className="h-12 bg-paper-border/50 rounded" />
                        <div className="h-12 bg-paper-border/50 rounded" />
                        <div className="h-12 bg-paper-border/50 rounded" />
                        <div className="h-12 bg-paper-border/50 rounded" />
                        <div className="h-12 bg-paper-border/50 rounded" />
                      </div>
                    ) : trending.length > 0 ? (
                      trending.slice(0, 6).map((item, index) => (
                        <Link
                          key={item.id}
                          to={`/${item.category?.slug || 'research'}/${item.slug}`}
                          className="group flex items-start space-x-3 py-3 hover:bg-paper/50 rounded-lg px-1.5 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-full bg-paper border border-paper-border text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-rfblue group-hover:text-white group-hover:border-rfblue transition-colors">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-semibold text-ink-darkest group-hover:text-rfblue transition-colors line-clamp-2 leading-snug">
                              {item.title}
                            </h4>
                            <span className="text-xs text-ink-muted mt-1 block">
                              {item.category?.name || 'Research'} • {item.readingTimeMin || 5} min read
                            </span>
                          </div>
                        </Link>
                      ))
                    ) : (
                      // Believable fallback when database has few articles (even 6 count)
                      [
                        { title: 'Best Laptops for Remote Work in 2026', cat: 'Technology' },
                        { title: 'AI Tools for Everyday Productivity', cat: 'Business' },
                        { title: 'Sustainable Travel & Ecotourism Trends', cat: 'Lifestyle' },
                        { title: 'Best CRM Architectures for Small Teams', cat: 'Business' },
                        { title: 'The Future of Electric Vehicles & Infrastructure', cat: 'Science' },
                        { title: 'Semiconductor Supply Dynamics & Foundries', cat: 'Economics' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start space-x-3 py-3">
                          <span className="w-6 h-6 rounded-full bg-paper border border-paper-border text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-semibold text-ink-darkest line-clamp-2 leading-snug">
                              {item.title}
                            </h4>
                            <span className="text-xs text-ink-muted mt-1 block">{item.cat}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. EXPLORE TOPICS SECTION ("Dive Into What Interests You") */}
        <section id="topics" className="py-16 lg:py-20 border-b border-paper-border bg-paper-warm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-rfblue mb-2">
                  <Search className="w-4 h-4 text-rfblue" />
                  <span>Explore Topics</span>
                </div>
                <h2>
                  Dive Into What Interests You
                </h2>
                <p className="mt-2.5 text-lead max-w-xl">
                  From emerging technologies to business trends and consumer products, discover research organized
                  around topics that matter.
                </p>
              </div>

              <Link
                to="/research"
                className="mt-4 md:mt-0 inline-flex items-center text-xs sm:text-sm font-bold text-rfblue hover:text-rfblue-700"
              >
                <span>View All Categories</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>

            {/* Dynamic Category Cards: Single Row Grid (<= 5) or Infinite Marquee Slider (> 5) */}
            {displayTopics.length > 5 ? (
              <div className="relative w-full overflow-hidden py-1">
                {/* Left and Right Edge Fade Gradients */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-24 bg-gradient-to-r from-paper-warm via-paper-warm/80 to-transparent z-10" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-24 bg-gradient-to-l from-paper-warm via-paper-warm/80 to-transparent z-10" />

                <div className="animate-marquee-smooth flex gap-5 flex-nowrap items-stretch">
                  {displayTopics.concat(displayTopics).map((topic, idx) => {
                    const IconComponent = topic.icon;
                    return (
                      <Link
                        key={`${topic.slug}-${idx}`}
                        to={`/categories/${topic.slug}`}
                        className="group bg-white p-5 sm:p-6 rounded-xl border border-paper-border hover:border-rfblue/40 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between w-[260px] sm:w-[280px] shrink-0 h-[215px]"
                      >
                        <div>
                          {/* Uni-Color Icon Container */}
                          <div className="w-11 h-11 rounded-lg bg-rfblue-50 text-rfblue flex items-center justify-center mb-3 group-hover:bg-rfblue group-hover:text-white transition-colors">
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <h3 className="text-card-title group-hover:text-rfblue transition-colors line-clamp-1">
                            {topic.name}
                          </h3>
                          <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed line-clamp-2">
                            {topic.desc}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-paper-border/60 flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-semibold text-ink-muted">
                            {topic.articleCount} {typeof topic.articleCount === 'number' ? 'articles' : ''}
                          </span>
                          <div className="w-7 h-7 rounded-full bg-paper flex items-center justify-center text-ink group-hover:bg-rfblue group-hover:text-white transition-colors">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className={`flex gap-5 overflow-x-auto no-scrollbar snap-x pb-2 lg:pb-0 lg:grid ${
                displayTopics.length <= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-5'
              }`}>
                {displayTopics.map((topic) => {
                  const IconComponent = topic.icon;
                  return (
                    <Link
                      key={topic.slug}
                      to={`/categories/${topic.slug}`}
                      className="group bg-white p-5 sm:p-6 rounded-xl border border-paper-border hover:border-rfblue/40 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between w-[260px] sm:w-[280px] lg:w-auto shrink-0 lg:shrink snap-start"
                    >
                      <div>
                        {/* Uni-Color Icon Container */}
                        <div className="w-11 h-11 rounded-lg bg-rfblue-50 text-rfblue flex items-center justify-center mb-3 group-hover:bg-rfblue group-hover:text-white transition-colors">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <h3 className="text-card-title group-hover:text-rfblue transition-colors line-clamp-1">
                          {topic.name}
                        </h3>
                        <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed line-clamp-2">
                          {topic.desc}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-paper-border/60 flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-semibold text-ink-muted">
                          {topic.articleCount} {typeof topic.articleCount === 'number' ? 'articles' : ''}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-paper flex items-center justify-center text-ink group-hover:bg-rfblue group-hover:text-white transition-colors">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 3. FEATURED RESEARCH / HERO ARTICLE INFINITE CAROUSEL */}
        {carouselArticles?.length > 0 && (
          <FeaturedArticlesCarousel articles={carouselArticles} />
        )}

        {/* 4. LATEST RESEARCH & INSIGHTS (4-Column Grid) */}
        <section id="latest-research" className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-paper-border">
            <div>
              <div className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-rfblue mb-1.5">
                <FileText className="w-4 h-4 text-rfblue" />
                <span>Editorial Library</span>
              </div>
              <h2>
                Latest Research & Insights
              </h2>
              <p className="mt-1.5 text-lead">
                Fresh perspectives, comparisons, analysis, and research from across our library.
              </p>
            </div>

            <Link
              to="/research"
              className="mt-3 sm:mt-0 inline-flex items-center text-xs sm:text-sm font-bold text-rfblue hover:underline"
            >
              <span>View All Articles</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2.5 overflow-x-auto pb-4 mb-8">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold tracking-wider transition-colors shrink-0 ${
                selectedCategory === null
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white border border-paper-border text-ink-muted hover:text-ink'
              }`}
            >
              All Topics
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold tracking-wider transition-colors shrink-0 ${
                  selectedCategory === cat.slug
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-paper-border text-ink-muted hover:text-ink'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* 4-Column Responsive Grid */}
          {isArticlesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : articles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {articles.slice(0, 8).map((article) => (
                <ArticleCard key={article.id} article={article} variant="standard" />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No articles in this topic"
              description="Be the first contributor to publish empirical research in this category."
            />
          )}
        </section>

        {/* 5. RESEARCH FORMATS ("More Than Just Articles") */}
        <section className="py-16 lg:py-20 border-y border-paper-border bg-paper-warm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-rfblue mb-2">
                <Layers className="w-4 h-4 text-rfblue" />
                <span>Structured Formats</span>
              </div>
              <h2>
                More Than Just Articles
              </h2>
              <p className="mt-2.5 text-lead">
                Research Factors brings together different formats to help readers understand subjects from multiple
                empirical angles.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 sm:p-7 rounded-xl border border-paper-border shadow-2xs">
                <div className="w-11 h-11 rounded-lg bg-rfblue-50 text-rfblue flex items-center justify-center mb-4">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-card-title mb-2">Deep Research</h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Detailed analysis and empirical investigation exploring a subject far beyond the headlines.
                </p>
              </div>

              <div className="bg-white p-6 sm:p-7 rounded-xl border border-paper-border shadow-2xs">
                <div className="w-11 h-11 rounded-lg bg-rfblue-50 text-rfblue flex items-center justify-center mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-card-title mb-2">Comparisons</h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Side-by-side research helping readers evaluate differences between products, services, and software.
                </p>
              </div>

              <div className="bg-white p-6 sm:p-7 rounded-xl border border-paper-border shadow-2xs">
                <div className="w-11 h-11 rounded-lg bg-rfblue-50 text-rfblue flex items-center justify-center mb-4">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-ink-darkest mb-2">Structured Reviews</h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Systematic evaluations based on features, real-world usability, pricing value, and verified data.
                </p>
              </div>

              <div className="bg-white p-6 sm:p-7 rounded-xl border border-paper-border shadow-2xs">
                <div className="w-11 h-11 rounded-lg bg-rfblue-50 text-rfblue flex items-center justify-center mb-4">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-ink-darkest mb-2">Industry Insights</h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Forward-looking perspectives examining shifts in emerging markets, semiconductors, and economies.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. BRAND SPONSORSHIP SECTION ("Partner With a Platform That Delivers Real Engagement") */}
        <section id="sponsorship" className="py-20 lg:py-24 bg-white border-b border-paper-border overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
              {/* Left Column: Value Copy */}
              <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-6">
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-rfblue-50 text-rfblue border border-rfblue-100 w-fit">
                    <Target className="w-4 h-4 text-rfblue" />
                    <span>For Brands & Marketers</span>
                  </div>

                  <h2>
                    Partner With a Platform That Delivers Real Audience Engagement
                  </h2>

                  <p className="text-lead">
                    Get your products, services, and stories in front of a highly engaged, research-minded audience. We
                    help brands build trust through authentic, high-quality sponsored content with transparent commercial
                    disclosure.
                  </p>
                </div>

                
              </div>

              {/* Center Column: 4 Animated Value Cards (1 & 3 Left, 2 & 4 Right) + Middle CTA Button */}
              <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-4">
                <motion.div
                  variants={sponsorshipContainerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  className="space-y-3.5 flex-1 flex flex-col justify-between"
                >
                  {/* Card 1: Slide in from Left */}
                  <motion.div
                    variants={cardSlideLeftVariants}
                    className="flex items-start space-x-4 p-4 rounded-xl border border-paper-border bg-paper/60 hover:bg-paper transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-rfblue-50 text-rfblue flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-rfblue" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-ink-darkest">Native Sponsored Articles</h4>
                      <p className="text-xs sm:text-sm text-ink-muted leading-snug">Editorial-style, high-quality research</p>
                    </div>
                  </motion.div>

                  {/* Card 2: Slide in from Right */}
                  <motion.div
                    variants={cardSlideRightVariants}
                    className="flex items-start space-x-4 p-4 rounded-xl border border-paper-border bg-paper/60 hover:bg-paper transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-rfblue-50 text-rfblue flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-rfblue" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-ink-darkest">Targeted Audience</h4>
                      <p className="text-xs sm:text-sm text-ink-muted leading-snug">Tech-savvy, informed & decision-makers</p>
                    </div>
                  </motion.div>

                  {/* Card 3: Slide in from Left */}
                  <motion.div
                    variants={cardSlideLeftVariants}
                    className="flex items-start space-x-4 p-4 rounded-xl border border-paper-border bg-paper/60 hover:bg-paper transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-rfblue-50 text-rfblue flex items-center justify-center shrink-0">
                      <Activity className="w-5 h-5 text-rfblue" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-ink-darkest">Measurable Impact</h4>
                      <p className="text-xs sm:text-sm text-ink-muted leading-snug">Real traffic, deep engagement & brand lift</p>
                    </div>
                  </motion.div>

                  {/* Card 4: Slide in from Right */}
                  <motion.div
                    variants={cardSlideRightVariants}
                    className="flex items-start space-x-4 p-4 rounded-xl border border-paper-border bg-paper/60 hover:bg-paper transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-rfblue-50 text-rfblue flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5 text-rfblue" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-ink-darkest">Flexible Collaboration</h4>
                      <p className="text-xs sm:text-sm text-ink-muted leading-snug">Custom packages tailored to campaign goals</p>
                    </div>
                  </motion.div>

                  {/* Primary Action Button Moved to Middle Column */}
                  <motion.div variants={cardButtonVariants} className="pt-2 flex justify-center">
                    <Link
                      to="/sponsorship"
                      className="inline-flex items-center justify-center w-full px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-rfblue hover:bg-rfblue-700 shadow-xs hover:shadow-md transition-all text-center"
                    >
                      <span>Learn About Brand Sponsorships</span>
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </motion.div>
                </motion.div>
              </div>

              {/* Right Column: Featured Sponsorship Case Study Card */}
              <div className="lg:col-span-4 flex flex-col h-full">
                <div className="h-full flex flex-col justify-between bg-white rounded-xl border border-paper-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative aspect-[16/10] overflow-hidden bg-paper shrink-0">
                    <img
                      src={normalizeMediaUrl('/images/sponsorship_case_study.jpg')}
                      alt="Brand Featured Collaboration"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-white/95 text-rfblue shadow-xs">
                      SPONSORED RESEARCH
                    </span>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-card-title">
                        How Our Partner Brands Reach the Right Audience
                      </h4>
                      <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
                        Read success stories & see how we help innovative brands grow with research-driven content.
                      </p>
                    </div>
                    <Link
                      to="/sponsorship"
                      className="mt-5 inline-flex items-center text-xs sm:text-sm font-bold text-rfblue hover:underline"
                    >
                      <span>View Sponsorship Options</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. EDITORIAL TRUST & HOW RESEARCH IS CREATED */}
        <section className="py-16 lg:py-24 border-b border-paper-border bg-paper-warm overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left 6 Cols: Methodology & Editorial Standards Visual */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="lg:col-span-6 flex items-center justify-center"
              >
                <div className="relative w-full max-w-[500px] aspect-square rounded-2xl overflow-hidden shadow-md border border-paper-border bg-white group">
                  <img
                    src={normalizeMediaUrl('/images/research_methodology.jpg')}
                    alt="Research Factors Methodology and Standards"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                </div>
              </motion.div>

              {/* Right 6 Cols: 4-Step Flow ("From Question to Insight") */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <div className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-rfblue mb-2">
                    <Activity className="w-4 h-4 text-rfblue" />
                    <span>How Research Is Created</span>
                  </div>
                  <h2>
                    From Question to Insight
                  </h2>
                  <p className="mt-2.5 text-lead">
                    A disciplined 4-stage process ensuring every piece of published research delivers clarity and utility.
                  </p>
                </div>

                <motion.div
                  className="space-y-3.5 pt-2"
                  variants={stepContainerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{
                    once: true,
                    amount: 0.15
                  }}
                >
                  {processSteps.map((s) => (
                    <motion.div
                      key={s.step}
                      variants={stepItemVariants}
                      className="flex items-start space-x-4 p-4 rounded-xl bg-white border border-paper-border hover:border-rfblue/30 transition-colors shadow-2xs"
                    >
                      <span className="w-8 h-8 rounded-lg bg-rfblue-50 text-rfblue font-bold text-xs sm:text-sm flex items-center justify-center shrink-0">
                        {s.step}
                      </span>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-ink-darkest">{s.title}</h4>
                        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                          {s.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. CREDIBILITY METRICS & READER TESTIMONIALS */}
        <section className="py-16 lg:py-24 bg-white  border-b border-paper-border transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              {/* Left Column: Impact Metrics */}
              <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-rfblue mb-2">
                    <Activity className="w-4 h-4 text-rfblue" />
                    <span>Our Impact</span>
                  </div>
                  <h2>
                    Built on Credibility, Trusted by Readers
                  </h2>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 pt-2">
                  <div className="p-4 sm:p-5 rounded-2xl bg-paper  border border-paper-border flex flex-col justify-between shadow-2xs hover:border-rfblue/30 transition-all">
                    <div className="text-stat-number">
                      <StatCounter end={1.2} decimals={1} suffix="M+" duration={2200} />
                    </div>
                    <div className="text-xs sm:text-sm text-ink-muted mt-1.5 font-medium leading-snug">
                      Monthly Readers
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-paper border border-paper-border flex flex-col justify-between shadow-2xs hover:border-rfblue/30 transition-all">
                    <div className="text-stat-number">
                      <StatCounter end={500} suffix="+" duration={2000} />
                    </div>
                    <div className="text-xs sm:text-sm text-ink-muted mt-1.5 font-medium leading-snug">
                      In-Depth Articles
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-paper border border-paper-border flex flex-col justify-between shadow-2xs hover:border-rfblue/30 transition-all">
                    <div className="text-stat-number">
                      <StatCounter end={200} suffix="+" duration={1800} />
                    </div>
                    <div className="text-xs sm:text-sm text-ink-muted mt-1.5 font-medium leading-snug">
                      Partner Brands
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-paper border border-paper-border flex flex-col justify-between shadow-2xs hover:border-rfblue/30 transition-all">
                    <div className="text-stat-number">
                      <StatCounter end={95} suffix="%" duration={1900} />
                    </div>
                    <div className="text-xs sm:text-sm text-ink-muted mt-1.5 font-medium leading-snug">
                      Reader Satisfaction
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Reader Testimonial Carousel Card */}
              <div className="lg:col-span-5">
                <div
                  className="bg-paper  p-6 sm:p-8 rounded-2xl border border-paper-border relative shadow-2xs flex flex-col justify-between h-[340px] sm:h-[310px] overflow-hidden select-none cursor-grab active:cursor-grabbing transition-colors"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Top Quote Icon & Slide Label */}
                  <div className="flex items-center justify-between">
                    <span className="text-4xl sm:text-5xl text-rfblue/30 leading-none select-none">
                      “
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      ({testimonialIndex + 1}/{testimonials.length})
                    </span>
                  </div>

                  {/* Carousel Track with smooth horizontal transition */}
                  <div className="relative w-full overflow-hidden my-auto py-2">
                    <div
                      className="flex transition-transform duration-500 ease-out w-full"
                      style={{ transform: `translateX(-${testimonialIndex * 100}%)` }}
                    >
                      {testimonials.map((t, idx) => (
                        <div key={idx} className="w-full shrink-0 pr-2">
                          <p className="text-sm sm:text-base lg:text-lg text-ink-darkest leading-relaxed italic line-clamp-4">
                            {t.quote}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Author Info & Controls */}
                  <div className="mt-4 pt-4 border-t border-paper-border flex items-center justify-between">
                    <div className="min-w-0 pr-3">
                      <h4 className="text-sm sm:text-base font-bold text-ink-darkest truncate">
                        {testimonials[testimonialIndex].author}
                      </h4>
                      <p className="text-xs text-ink-muted truncate">
                        {testimonials[testimonialIndex].role}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      {/* Dots pagination */}
                      <div className="flex items-center space-x-1.5">
                        {testimonials.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setTestimonialIndex(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              testimonialIndex === i
                                ? 'w-5 bg-rfblue'
                                : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                            }`}
                            aria-label={`Go to testimonial ${i + 1}`}
                          />
                        ))}
                      </div>

                      {/* Arrow Buttons */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() =>
                            setTestimonialIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))
                          }
                          className="w-7 h-7 rounded-lg border border-paper-border  bg-white  flex items-center justify-center text-ink  hover:bg-paper  transition-colors"
                          aria-label="Previous testimonial"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setTestimonialIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))
                          }
                          className="w-7 h-7 rounded-lg border border-paper-border  bg-white  flex items-center justify-center text-ink  hover:bg-paper  transition-colors"
                          aria-label="Next testimonial"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        

        {/* 10. NEWSLETTER ("Stay Ahead with Quality Research") */}
        <section className="py-16 lg:py-20 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-widest text-rfblue-200">GET STARTED</span>
                <h2 className="text-white">
                  Stay Ahead with Quality Research
                </h2>
                <p className="text-lead text-slate-300 max-w-md">
                  Join our community of curious minds and get selected research, comparisons, and market developments
                  delivered to your inbox.
                </p>
              </div>

              <div className="lg:col-span-7">
                {newsletterSubscribed ? (
                  <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 text-center text-sm text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                    Thank you! You are subscribed to Research Factors updates.
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Enter your email address..."
                      className="flex-1 px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rfblue-400"
                    />
                    <button
                      type="submit"
                      className="px-7 py-3.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider bg-rfblue hover:bg-rfblue-700 text-white transition-colors shrink-0 shadow-xs"
                    >
                      Subscribe
                    </button>
                  </form>
                )}
                <p className="mt-2.5 text-xs sm:text-sm text-slate-400">
                  No spam or unnecessary emails. Unsubscribe anytime with one click.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 11. DUAL FINAL CALL-TO-ACTION (Readers vs Businesses) */}
        <section className="py-16 lg:py-20 bg-white border-t border-paper-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* For Readers Card */}
              <div className="p-8 sm:p-10 rounded-xl border border-paper-border bg-paper flex flex-col justify-between shadow-2xs">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-2.5">
                    FOR READERS & RESEARCHERS
                  </span>
                  <h3 className="mb-3">
                    Have Something You Want to Understand Better?
                  </h3>
                  <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
                    Start exploring Research Factors and discover empirical research across topics that matter to your
                    decisions.
                  </p>
                </div>
                <div className="pt-6">
                  <Link
                    to="/research"
                    className="inline-flex items-center px-6 py-3 rounded-lg text-xs sm:text-sm font-semibold text-white bg-rfblue hover:bg-rfblue-700 transition-colors shadow-2xs"
                  >
                    <span>Explore Research Library</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </div>
              </div>

              {/* For Brands / Sponsorships Card */}
              <div className="p-8 sm:p-10 rounded-xl border border-paper-border bg-paper flex flex-col justify-between shadow-2xs">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rfblue block mb-2.5">
                    FOR BUSINESSES & PR TEAMS
                  </span>
                  <h3 className="mb-3">
                    Have a Product, Service, or Story Worth Exploring?
                  </h3>
                  <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
                    Talk to our sponsorship team about research-led content, product comparison features, and brand
                    collaborations.
                  </p>
                </div>
                <div className="pt-6">
                  <Link
                    to="/sponsorship"
                    className="inline-flex items-center px-6 py-3 rounded-lg text-xs sm:text-sm font-semibold text-ink bg-white border border-paper-border hover:bg-paper-warm transition-colors shadow-2xs"
                  >
                    <span>Partner With Us via Sponsorship</span>
                    <ArrowRight className="w-4 h-4 ml-1.5 text-rfblue" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
