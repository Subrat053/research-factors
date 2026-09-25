import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import { usePageContent } from '../../services/pages.api.js';
import { seoApi } from '../../services/seo.api.js';
import { SeoHead } from '../../components/common/SeoHead.jsx';
import {
  Search,
  Scale,
  BookOpen,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
  Mail,
  Building2,
  Layers,
  Award
} from 'lucide-react';

const approachIcons = {
  Research: Search,
  Compare: Scale,
  Explain: BookOpen,
  Empower: Sparkles
};

export default function AboutPage() {
  const { data: page } = usePageContent('about');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About Research Factors',
    description:
      'Research Factors is an empirical research and digital publication platform delivering peer-reviewed product comparisons, technology evaluations, and rigorous consumer insights.',
    url: 'https://researchfactors.com/about',
    publisher: {
      '@type': 'Organization',
      name: 'Research Factors Inc.',
      url: 'https://researchfactors.com',
      logo: 'https://researchfactors.com/favicon.svg'
    }
  };

  const introParagraphs = page?.intro || [
    'Research Factors is a research-driven platform built to make complex choices easier to understand.',
    'Every day, people compare products, services, companies, technologies, features, prices, and alternatives before making decisions. But finding useful information often means going through dozens of pages, conflicting opinions, promotional claims, and incomplete comparisons.',
    'Research Factors was created to make that process simpler.',
    'We bring research, comparisons, reviews, observations, and relevant information together in one place so readers can understand their options before making a decision.'
  ];

  const { data: seoResponse } = useQuery({
    queryKey: ['seo', 'page', 'about'],
    queryFn: () => seoApi.resolveSeo({ type: 'PAGE', id: 'about' }),
    staleTime: 1000 * 60 * 10
  });
  const pageSeo = seoResponse?.data || null;

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-rfblue-100 selection:text-rfblue-900">
      <SeoHead
        seo={pageSeo}
        title="About Research Factors — Editorial Creed & Peer Review Standards"
        description="Research Factors is a research-driven platform publishing in-depth articles, comparisons, and expert insights to help readers make informed, confident choices."
        canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/about` : 'https://researchfactors.com/about'}
        jsonLd={pageSeo?.schema?.jsonLd || jsonLd}
      />

      <Header />

      <main className="flex-1">
        {/* Editorial Hero Header */}
        <section className="relative py-14 sm:py-20 border-b border-paper-border bg-paper-warm overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-rfblue-50 text-rfblue border border-rfblue-100 mb-6 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Editorial Manifesto</span>
            </div>

            <h1 className="text-ink-darkest">
              Know More. <span className="text-rfblue italic">Choose Better.</span>
            </h1>

            <p className="mt-5 text-lead text-base sm:text-xl max-w-2xl mx-auto">
              We turn scattered internet claims and promotional noise into structured, contextual research you can trust.
            </p>

            <div className="mt-6 flex items-center justify-center space-x-4 text-xs text-ink-light">
              <span>Published by Research Factors Editorial Board</span>
              <span>•</span>
              <span>Updated: {page?.lastUpdated || 'September 22, 2026'}</span>
            </div>
          </div>
        </section>

        {/* Core Manifesto Narrative */}
        <section className="py-14 sm:py-18">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl space-y-6 text-base sm:text-lg text-ink leading-relaxed">
              {introParagraphs.map((p, idx) => (
                <p key={idx} className={idx === 0 ? 'text-lg sm:text-xl font-medium text-ink-darkest leading-snug' : ''}>
                  {p}
                </p>
              ))}
            </div>

            {/* Section: What We Do */}
            <div className="mt-14 pt-12 border-t border-paper-border">
              <div className="max-w-3xl mb-6">
                <h2>
                  What We Do
                </h2>
                <p className="mt-4 text-base text-ink leading-relaxed">
                  Research Factors publishes research-based articles, reviews, comparisons, guides, and analysis across diverse technological and consumer categories. Rather than simply telling readers what to buy, our goal is to provide information that helps them understand <strong className="font-semibold text-ink-darkest">why one option may differ from another</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {[
                  'Products and their core technical features',
                  'Product-to-product empirical comparisons',
                  'Services and institutional providers',
                  'Frontier technologies, tools, and platforms',
                  'Consumer choices and trade-off matrices',
                  'Industry developments and supply benchmarks',
                  'Practical buying considerations and budgets',
                  'Real-world use cases and limitations'
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-3 p-3.5 rounded-xl bg-paper-warm/70 border border-paper-border/60 text-xs sm:text-sm text-ink font-normal hover:bg-paper-warm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-rfblue shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section: 4 Principles Cards */}
            <div className="mt-14 pt-12 border-t border-paper-border">
              <div className="text-center sm:text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-rfblue">Methodology</span>
                <h2 className="mt-1">
                  Our Approach
                </h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Every article published on Research Factors adheres to four foundational pillars:
                </p>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  {
                    title: 'Research',
                    icon: Search,
                    desc: 'We look beyond surface-level claims and gather empirical data before developing content.'
                  },
                  {
                    title: 'Compare',
                    icon: Scale,
                    desc: 'We examine meaningful architectural differences rather than relying on headline specs.'
                  },
                  {
                    title: 'Explain',
                    icon: BookOpen,
                    desc: 'We aim to present complicated technical information in clean, understandable prose.'
                  },
                  {
                    title: 'Empower',
                    icon: Sparkles,
                    desc: 'We give readers the tools to make decisions that fit their exact requirements.'
                  }
                ].map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={i}
                      className="p-5 rounded-2xl bg-white border border-paper-border shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-rfblue-50 text-rfblue flex items-center justify-center mb-4">
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className="text-card-title">{card.title}</h3>
                        <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
                          {card.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section: Context & Community */}
            <div className="mt-14 pt-12 border-t border-paper-border">
              <div className="mb-8">
                <span className="text-eyebrow text-rfblue">Editorial Principles</span>
                <h2 className="text-ink-darkest mt-1">
                  Context, Community & Independence
                </h2>
                <p className="mt-2 text-ink-muted">
                  How we maintain research integrity across every analysis we publish.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-white border border-paper-border shadow-2xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-card-title text-ink-darkest">
                      Research Before Recommendation
                    </h3>
                    <p className="mt-3 text-sm sm:text-base text-ink leading-relaxed">
                      The internet is full of quick opinions. Research Factors focuses on the data behind those opinions. When developing content, we examine publicly available benchmarks, engineering specifications, published documentation, verified user experiences, and market data across multiple perspectives.
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-paper-border shadow-2xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-card-title text-ink-darkest">
                      Comparisons That Put Context First
                    </h3>
                    <p className="mt-3 text-sm sm:text-base text-ink leading-relaxed">
                      A product or service cannot always be judged by one feature. Price, durability, ergonomics, performance, limitations, support, and compatibility all interact. That is why our comparisons aim to provide context instead of focusing on a single headline number.
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-paper-border shadow-2xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-card-title text-ink-darkest">
                      Community Perspectives Matter
                    </h3>
                    <p className="mt-3 text-sm sm:text-base text-ink leading-relaxed">
                      Real experiences provide nuances that laboratory specifications alone cannot reveal. Research Factors invites readers and verified practitioners to contribute comments, review notes, and empirical feedback under strict editorial moderation.
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-paper-border shadow-2xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-card-title text-ink-darkest">
                      Transparency & Independence
                    </h3>
                    <p className="mt-3 text-sm sm:text-base text-ink leading-relaxed">
                      Trust is the currency of research journalism. Where applicable, Research Factors clearly discloses affiliate relationships, sponsored arrangements, or editorial disclosures. Third-party brand sponsorships never dictate research methodologies or comparative outcomes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Why We Exist Callout Banner */}
            <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-paper-warm border border-paper-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-wider text-rfblue">Our Vision</span>
                <h3 className="mt-1">
                  Better decisions start with better information.
                </h3>
                <p className="mt-3 text-sm sm:text-base text-ink-muted leading-relaxed">
                  Our vision is to build a trusted research platform where people can explore options, understand differences, examine evidence, learn from other experiences, and make more informed decisions.
                </p>
              </div>
            </div>

            {/* Contact & Inquiries CTA Card */}
            <div className="mt-14 pt-8 border-t border-paper-border flex flex-col sm:flex-row items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-white border border-paper-border shadow-2xs">
              <div>
                <h4 className="text-card-title">
                  Have a suggestion or research inquiry?
                </h4>
                <p className="text-xs sm:text-sm text-ink-light mt-1">
                  Our editorial desk welcomes reader feedback, corrections, and research pitches.
                </p>
              </div>
              <Link
                to="/contact"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rfblue hover:bg-rfblue-700 shadow-2xs transition-all shrink-0"
              >
                <span>Get in Touch</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
