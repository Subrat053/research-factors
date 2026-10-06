import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery } from '@tanstack/react-query';
import { contactApi } from '../../services/contact.api.js';
import { seoApi } from '../../services/seo.api.js';
import { normalizeMediaUrl } from '../../services/media.api.js';
import { DEFAULT_SPONSORSHIP_TIERS } from '../../data/defaultSponsorship.js';
import { SeoHead } from '../../components/common/SeoHead.jsx';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import {
  Sparkles,
  Handshake,
  ArrowRight,
  CheckCircle2,
  FileText,
  BarChart3,
  ShieldCheck,
  Send,
  Building2,
  Mail,
  User,
  Globe,
  Layers,
  Award,
  Loader2,
  AlertCircle,
  Search,
  MessageSquare,
  Check,
  ChevronDown,
  Scale,
  Compass,
  FileCheck,
  Eye,
  Shield,
  HelpCircle
} from 'lucide-react';

export default function SponsorshipPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    website: '',
    sponsorshipType: 'launch-article',
    budgetTimeline: 'q4-2026',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const inquiryMutation = useMutation({
    mutationFn: (payload) => contactApi.submitSponsorshipInquiry(payload),
    onSuccess: () => {
      setIsSubmitted(true);
      setErrorMessage(null);
    },
    onError: (err) => {
      setErrorMessage(err?.message || 'Unable to transmit inquiry. Please check your connection and try again.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage(null);
    inquiryMutation.mutate(formData);
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const handleSelectTier = (tierId) => {
    setFormData((prev) => ({ ...prev, sponsorshipType: tierId }));
    const formEl = document.getElementById('inquiry-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
      const nameInput = formEl.querySelector('input[type="text"]');
      if (nameInput) {
        setTimeout(() => nameInput.focus(), 400);
      }
    }
  };

  // Dynamic Sponsorship Packages from API with offline fallback
  const { data: packagesData, isLoading: isPackagesLoading } = useQuery({
    queryKey: ['sponsorship-packages'],
    queryFn: async () => {
      const res = await contactApi.getSponsorshipPackages();
      return res?.data || null;
    },
    staleTime: 1000 * 60 * 10
  });

  const pricingTiers = (packagesData || DEFAULT_SPONSORSHIP_TIERS).filter((t) => t.isActive !== false);

  const sponsorshipFormats = [
    {
      icon: FileText,
      title: 'Sponsored Research Articles',
      description:
        'In-depth, research-driven articles that explore a product, technology, category, problem, or emerging market trend from multiple perspectives. Your brand, product, or solution is incorporated naturally into the research so readers can understand its value, use cases, differentiators, and relevance while discovering information that helps them make more informed decisions. This format is designed to build awareness, educate high-intent audiences, strengthen brand credibility, and position your company within meaningful conversations around your industry.',
      tags: ['Product Education', 'Category Awareness', 'Thought Leadership', 'Market Positioning']
    },
    {
      icon: Award,
      title: 'Sponsored Product Reviews',
      description:
        'Detailed, structured reviews covering architectural features, usability, technical strengths, practical limitations, market positioning, and suitable use cases.',
      tags: ['Product Launches', 'Product Education', 'Consideration-Stage Audiences']
    },
    {
      icon: Scale,
      title: 'Product & Solution Comparisons',
      description:
        'Research-based comparisons between products, solutions, approaches, or architectures using defined evaluation criteria and objective technical matrices.',
      tags: ['Competitive Positioning', 'Buyer Research', 'Feature Education']
    },
    {
      icon: MessageSquare,
      title: 'Expert & Brand Insights',
      description:
        'Structured interviews, technical commentaries, engineering perspectives, and knowledge-led articles featuring your leadership and engineering teams.',
      tags: ['Thought Leadership', 'Engineering Expertise', 'Brand Authority']
    },
    {
      icon: BarChart3,
      title: 'Industry Research & Benchmark Reports',
      description:
        'Collaborative reports and whitepapers examining market categories, empirical industry trends, performance benchmarks, and emerging technological developments.',
      tags: ['B2B Brands', 'Enterprise Software', 'Technology Companies', 'Market Positioning']
    }
  ];

  const roadmapSteps = [
    {
      number: '01',
      title: 'Brief',
      description: 'You share your product, target audience, campaign goals, and the topic you want to explore.'
    },
    {
      number: '02',
      title: 'Research Angle',
      description: 'Research Factors develops a suitable editorial angle around the questions your target readers are actively investigating.'
    },
    {
      number: '03',
      title: 'Content Development',
      description: 'Our editorial desk develops the long-form research piece, review, or comparison around agreed source materials.'
    },
    {
      number: '04',
      title: 'Review & Disclosure',
      description: 'Product information is verified for factual technical accuracy, while transparent commercial disclosures are finalized.'
    },
    {
      number: '05',
      title: 'Publish & Distribute',
      description: 'The completed piece is published on Research Factors and surfaced across relevant topic directories and search channels.'
    }
  ];

  const audienceIntents = [
    'Compare products and technologies',
    'Understand unfamiliar categories',
    'Research before purchasing',
    'Evaluate competing solutions',
    'Understand industry developments',
    'Explore detailed reviews',
    'Learn how products work',
    'Find evidence before making decisions'
  ];

  const transparencyTenets = [
    {
      icon: Eye,
      title: 'Clear Disclosure',
      description:
        'Sponsored and commercially supported content is identified clearly and prominently so readers always understand commercial relationships.'
    },
    {
      icon: Compass,
      title: 'Useful Before Promotional',
      description:
        'Content is structured around the reader’s research questions and evidence-backed solutions rather than reproducing marketing PR copy.'
    },
    {
      icon: FileCheck,
      title: 'Factual Accuracy',
      description:
        'Product specifications, architectural claims, and brand-provided data are reviewed and verified within the agreed technical scope.'
    },
    {
      icon: Shield,
      title: 'Defined Editorial Scope',
      description:
        'Sponsors provide factual input and review; independent editorial presentation, honest evaluations, and ethical disclosures remain transparent.'
    }
  ];

  const faqs = [
    {
      question: 'Can we sponsor an article about our product?',
      answer:
        'Yes. Research Factors develops sponsored research content around an agreed topic, product, category, or market question, embedding your product naturally within the broader problem and solution framework.'
    },
    {
      question: 'Can we request a product review?',
      answer:
        'Yes. Sponsored reviews examine architecture, usability, features, practical strengths, and suitable use cases. We define the review scope in advance to ensure the coverage remains objective and informative for readers.'
    },
    {
      question: 'Can we provide our own content?',
      answer:
        'You can provide documentation, product whitepapers, technical specifications, and expert input. The final format, editorial presentation, and tone are developed in accordance with Research Factors editorial standards.'
    },
    {
      question: 'Will sponsored content be disclosed?',
      answer:
        'Yes, always. Transparent commercial disclosure is foundational to our reader trust. Every sponsored article carries a prominent sponsorship disclosure detailing the commercial relationship.'
    },
    {
      question: 'Can we approve the article before publication?',
      answer:
        'Sponsors receive review access to verify factual technical accuracy, product specifications, and company details prior to public release.'
    },
    {
      question: 'Can you compare our product with competitors?',
      answer:
        'Yes. We offer comparison formats where products or technological approaches are evaluated against defined technical criteria to help readers understand trade-offs.'
    },
    {
      question: 'How long does a sponsored article remain published?',
      answer:
        'Sponsored research remains permanently in the Research Factors archive, continuing to attract qualified search, social, and topic-directory readers months and years after publication.'
    },
    {
      question: 'Do you offer custom sponsorship packages?',
      answer:
        'Yes. We accommodate multi-article series, category report co-sponsorships, and custom brand collaborations. Contact our sponsorship desk through the inquiry form below to discuss custom options.'
    }
  ];

  const { data: seoResponse } = useQuery({
    queryKey: ['seo', 'page', 'sponsorship'],
    queryFn: () => seoApi.resolveSeo({ type: 'PAGE', id: 'sponsorship' }),
    staleTime: 1000 * 60 * 10
  });
  const pageSeo = seoResponse?.data || null;

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <SeoHead
        seo={pageSeo}
        title="Research Sponsorship & Academic Grants | Research Factors"
        description="Reach readers who research before they decide. Research Factors helps brands turn products, technologies, and ideas into useful research-driven content with transparent commercial disclosure."
        canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/sponsorship` : 'https://researchfactors.com/sponsorship'}
      />

      <Header />

      <main className="flex-1">
        {/* 1. HERO SECTION */}
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 border-b border-paper-border bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Value Proposition */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rfblue-50 text-rfblue border border-rfblue-100 shadow-2xs mb-6">
                  {/* <Sparkles  /> */}
                  <Handshake className="w-3.5 h-3.5 text-rfblue"/>
                  <span>Brand Sponsorships & Research Collaborations</span>
                </div>

                <h1 className="tracking-tight text-ink-darkest">
                  Reach Readers Who Research Before They Decide
                </h1>

                <p className="mt-6 text-lg sm:text-xl text-ink-muted leading-relaxed font-normal">
                  Research Factors helps brands turn products, technologies, and ideas into useful research-driven
                  content for readers actively comparing options, understanding markets, and evaluating what comes next.
                </p>

                <div className="mt-8 flex flex-wrap gap-4 items-center">
                  <a
                    href="#tiers"
                    className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-rfblue hover:bg-rfblue-700 shadow-xs transition-all"
                  >
                    <span>View Packages & Pricing</span>
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </a>
                  <a
                    href="#sponsorship-formats"
                    className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-ink-muted hover:text-ink-darkest bg-paper hover:bg-paper-warm border border-paper-border transition-colors"
                  >
                    <span>Explore Formats</span>
                  </a>
                </div>

                <p className="mt-6 text-sm text-ink-muted/80 leading-relaxed max-w-xl">
                  Sponsored content is clearly disclosed and developed around relevant reader intent, with commercial
                  involvement presented transparently.
                </p>
              </div>

              {/* Right Column: Clean Picture Only */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden border border-paper-border shadow-md bg-paper">
                  <img
                    src={normalizeMediaUrl('/images/sponsorship_case_study.png')}
                    alt="Research Factors Brand Collaboration Workspace"
                    className="w-full h-80 sm:h-96 lg:h-[420px] object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. CORE VALUE PILLARS (Preserved As-Is) */}
        <section className="py-16 border-b border-paper-border bg-paper-warm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border border-paper-border shadow-xs">
                <div className="w-10 h-10 rounded-lg bg-rfblue-50 flex items-center justify-center text-rfblue mb-4">
                  <FileText className="w-5 h-5 text-rfblue" />
                </div>
                <h3 className="text-base font-bold text-ink-darkest mb-1.5">Native Sponsored Research</h3>
                <p className="text-sm text-ink-muted leading-relaxed font-normal">
                  Deep, structured articles written with the same editorial rigor as independent studies.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-paper-border shadow-xs">
                <div className="w-10 h-10 rounded-lg bg-rfblue-50 flex items-center justify-center text-rfblue mb-4">
                  <Layers className="w-5 h-5 text-rfblue" />
                </div>
                <h3 className="text-base font-bold text-ink-darkest mb-1.5">Product & Feature Comparisons</h3>
                <p className="text-sm text-ink-muted leading-relaxed font-normal">
                  Help prospective customers understand what your product solves, where it fits, and how it compares.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-paper-border shadow-xs">
                <div className="w-10 h-10 rounded-lg bg-rfblue-50 flex items-center justify-center text-rfblue mb-4">
                  <BarChart3 className="w-5 h-5 text-rfblue" />
                </div>
                <h3 className="text-base font-bold text-ink-darkest mb-1.5">Industry Reports & Benchmarks</h3>
                <p className="text-sm text-ink-muted leading-relaxed font-normal">
                  Co-sponsor comprehensive market surveys, empirical datasets, and state-of-the-industry reports.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-paper-border shadow-xs">
                <div className="w-10 h-10 rounded-lg bg-rfblue-50 flex items-center justify-center text-rfblue mb-4">
                  <ShieldCheck className="w-5 h-5 text-rfblue" />
                </div>
                <h3 className="text-base font-bold text-ink-darkest mb-1.5">Transparent Credibility</h3>
                <p className="text-sm text-ink-muted leading-relaxed font-normal">
                  Clear ethical guidelines and sponsorship disclosures that preserve high reader trust.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. SPONSORSHIP FORMATS ("What Can We Create With Your Brand?") */}
        <section id="sponsorship-formats" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-rfblue block mb-2">
              Deliverables & Options
            </span>
            <h2 className="text-ink-darkest tracking-tight">
              What Can We Create With Your Brand?
            </h2>
            <p className="mt-3 text-base text-ink-muted leading-relaxed font-normal">
              Choose from structured research formats designed around how professional readers, engineers, and decision-makers
              evaluate products and market categories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sponsorshipFormats.map((format, idx) => {
              const IconComponent = format.icon;
              return (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl border border-paper-border p-7 shadow-xs flex flex-col justify-between hover:border-rfblue-300 transition-colors ${
                    idx === 0 ? 'md:col-span-2 lg:col-span-2' : ''
                  }`}
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-rfblue-50 flex items-center justify-center text-rfblue mb-5">
                      <IconComponent className="w-6 h-6 text-rfblue" />
                    </div>
                    <h3 className="text-card-title text-ink-darkest mb-2.5">
                      {format.title}
                    </h3>
                    <p className="text-sm sm:text-base text-ink leading-relaxed mb-6 font-normal">
                      {format.description}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted/80 block mb-2.5">
                      Useful For:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {format.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-paper text-ink border border-paper-border"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. COLLABORATION ROADMAP ("From Product Brief to Published Research") */}
        <section id="collaboration-process" className="py-20 bg-paper-warm border-y border-paper-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-rfblue block mb-2">
                Structured Process
              </span>
              <h2 className="text-ink-darkest tracking-tight">
                From Product Brief to Published Research
              </h2>
              <p className="mt-3 text-base text-ink-muted leading-relaxed font-normal">
                A clear, predictable roadmap from initial product brief to long-term reader discovery.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {roadmapSteps.map((step, sIdx) => (
                <div
                  key={sIdx}
                  className="bg-white p-6 rounded-xl border border-paper-border shadow-2xs relative flex flex-col justify-between"
                >
                  <div>
                    <span className="text-2xl font-bold text-rfblue/40 block mb-3">
                      {step.number}
                    </span>
                    <h3 className="text-base font-bold text-ink-darkest mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-ink-muted leading-relaxed font-normal">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. PRICING & SPONSORSHIP PACKAGES */}
        <section id="tiers" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-14">
          <div className="text-center max-w-3xl mx-auto mb-16">
            
            <h2 className="text-ink-darkest tracking-tight">
              Sponsorship Packages & Pricing
            </h2>
            <p className="mt-3 text-base text-ink-muted leading-relaxed font-normal">
              Direct, transparent rates for brands seeking research-backed editorial presence. Every package includes permanent archiving, full SEO indexing, and transparent commercial disclosure.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-2">
            {pricingTiers.map((tier) => (
              <div
                key={tier.id}
                className={`bg-white rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                  tier.isPopular
                    ? 'border-2 border-rfblue shadow-lg -translate-y-1'
                    : 'border border-paper-border shadow-xs hover:border-paper-border/80 hover:shadow-sm'
                }`}
              >
                {tier.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rfblue text-white shadow-xs">
                      <Sparkles className="w-3 h-3" />
                      <span>Most Popular</span>
                    </span>
                  </div>
                )}

                <div>
                  <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-rfblue block mb-2">
                      {tier.kicker}
                    </span>
                    <h3 className="text-2xl font-serif font-bold text-ink-darkest mb-3">
                      {tier.name}
                    </h3>
                    <div className="flex items-baseline gap-1.5 mb-1.5">
                      <span className="text-4xl sm:text-5xl font-bold font-sans text-ink-darkest tracking-tight">
                        {tier.price}
                      </span>
                    </div>
                    <span className="text-xs text-ink-light block mb-4">
                      {tier.period}
                    </span>
                    <p className="text-sm text-ink-muted leading-relaxed min-h-[44px]">
                      {tier.description}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-paper-border/70 mb-8">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-darkest block mb-4">
                      What's Included:
                    </span>
                    <ul className="space-y-3 text-xs sm:text-sm text-ink">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-rfblue-50 text-rfblue flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                          </div>
                          <span className="leading-snug text-ink-muted">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => handleSelectTier(tier.id)}
                    className={`w-full py-3.5 px-6 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      tier.isPopular
                        ? 'bg-rfblue hover:bg-rfblue-700 text-white shadow-xs hover:shadow'
                        : 'bg-paper hover:bg-rfblue hover:text-white text-ink-darkest border border-paper-border hover:border-rfblue'
                    }`}
                  >
                    <span>{tier.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bespoke Collaboration Notice */}
          <div className="mt-12 p-6 rounded-2xl bg-paper border border-paper-border max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <h4 className="text-sm font-bold text-ink-darkest">Looking for a Custom Campaign or Category Co-Sponsorship?</h4>
              <p className="text-xs text-ink-muted mt-0.5">We accommodate custom whitepaper syndication, multi-quarter research tracks, and live datasets.</p>
            </div>
            <a
              href="#inquiry-form"
              onClick={() => handleSelectTier('custom-collaboration')}
              className="shrink-0 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg border border-paper-border hover:border-rfblue bg-white hover:text-rfblue text-ink-darkest transition-colors cursor-pointer"
            >
              Discuss Custom Scope
            </a>
          </div>
        </section>

        {/* 8. SPONSORSHIP FAQS (Interactive Accordion) */}
        <section id="faqs" className="py-20 bg-paper-warm border-y border-paper-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-rfblue block mb-2">
                Common Questions
              </span>
              <h2 className="text-ink-darkest tracking-tight">
                Sponsorship FAQs
              </h2>
              <p className="mt-3 text-base text-ink-muted leading-relaxed font-normal">
                Answers to frequently asked questions about sponsoring research content and partnering with Research Factors.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, fIdx) => {
                const isOpen = openFaqIndex === fIdx;
                return (
                  <div
                    key={fIdx}
                    className={`bg-white rounded-xl border transition-all duration-300 shadow-2xs overflow-hidden ${
                      isOpen ? 'border-rfblue/40 shadow-xs' : 'border-paper-border hover:border-paper-border/80'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(fIdx)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between space-x-4 focus:outline-none transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span
                        className={`text-sm sm:text-base font-semibold transition-colors duration-200 ${
                          isOpen ? 'text-rfblue' : 'text-ink-darkest'
                        }`}
                      >
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-ink-muted shrink-0 transition-transform duration-300 ease-in-out ${
                          isOpen ? 'rotate-180 text-rfblue' : ''
                        }`}
                      />
                    </button>

                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-6 pb-5 pt-1 border-t border-paper-border/60">
                          <p className="text-sm sm:text-base text-ink leading-relaxed font-normal">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 9. SPONSORSHIP INQUIRY FORM (Preserved As-Is) */}
        <section id="inquiry-form" className="py-20 bg-white scroll-mt-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-ink-darkest">
                Start a Brand Collaboration
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                Tell us about your brand, target audience, and research goals. Our sponsorship team will respond within 24 hours.
              </p>
            </div>

            {isSubmitted ? (
              <div className="p-8 rounded-xl bg-rfblue-50 border border-rfblue-100 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rfblue text-white flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-ink-darkest">Thank You for Reaching Out</h3>
                <p className="text-sm text-ink-muted max-w-md mx-auto">
                  We have received your sponsorship inquiry. An editorial partnership specialist will review your project and get back to you shortly.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-white border border-paper-border text-ink hover:bg-paper cursor-pointer"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 bg-paper p-8 rounded-xl border border-paper-border shadow-xs">
                {errorMessage && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-darkest mb-2">
                      Your Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3.5 text-ink-light" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Sarah Jenkins"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-paper-border bg-white text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-rfblue/20 focus:border-rfblue transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-darkest mb-2">
                      Work Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-ink-light" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="sarah@company.com"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-paper-border bg-white text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-rfblue/20 focus:border-rfblue transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-darkest mb-2">
                      Company / Brand Name
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-ink-light" />
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Acme Technologies"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-paper-border bg-white text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-rfblue/20 focus:border-rfblue transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-darkest mb-2">
                      Website URL
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 absolute left-3.5 top-3.5 text-ink-light" />
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-paper-border bg-white text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-rfblue/20 focus:border-rfblue transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-darkest mb-2">
                    What would you like to sponsor?
                  </label>
                  <select
                    value={formData.sponsorshipType}
                    onChange={(e) => setFormData({ ...formData, sponsorshipType: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-paper-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rfblue/20 focus:border-rfblue transition-all"
                  >
                    <optgroup label="Sponsorship Packages">
                      {pricingTiers.map((tier) => (
                        <option key={tier.id} value={tier.id}>
                          {tier.name} — {tier.price}{tier.isPopular ? ' (Most Popular)' : ''}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Bespoke Formats & Custom">
                      <option value="sponsored-research">Native Research Article</option>
                      <option value="product-review">Product Review</option>
                      <option value="product-comparison">Product & Solution Comparison</option>
                      <option value="expert-insight">Brand Insight Feature</option>
                      <option value="industry-report">Industry Benchmark Report</option>
                      <option value="custom-collaboration">Custom Collaboration</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-darkest mb-2">
                    Tell Us what you want
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about the topic you'd like to explore, target audience, and key goals..."
                    className="w-full px-4 py-3 rounded-lg border border-paper-border bg-white text-sm text-ink placeholder:text-ink-light leading-relaxed focus:outline-none focus:ring-2 focus:ring-rfblue/20 focus:border-rfblue transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={inquiryMutation.isPending}
                  className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-[12px] sm:text-sm font-bold uppercase tracking-wider text-white bg-rfblue hover:bg-rfblue-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  {inquiryMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  <span>{inquiryMutation.isPending ? 'Sharing Your Idea With Us...' : 'Share Your Idea With Us'}</span>
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
