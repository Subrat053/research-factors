import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import { usePageContent } from '../../services/pages.api.js';
import { seoApi } from '../../services/seo.api.js';
import { SeoHead } from '../../components/common/SeoHead.jsx';
import {
  BookOpen,
  Calendar,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Mail,
  ChevronRight,
  Sparkles,
  Scale,
  FileCheck,
  AlertCircle
} from 'lucide-react';

export default function EditorialGuidelinesPage() {
  const { data: page } = usePageContent('editorial-guidelines');
  const [activeSection, setActiveSection] = useState('core-philosophy');

  const sections = page?.sections || [];

  // Scrollspy to automatically highlight the current active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (e, id) => {
    if (e) e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://researchfactors.com/editorial-guidelines#webpage',
        name: 'Editorial Guidelines & Review Standards — Research Factors',
        description:
          'Explore the editorial guidelines, empirical research methodologies, peer-review standards, and conflict-of-interest firewalls governing Research Factors.',
        url: 'https://researchfactors.com/editorial-guidelines',
        publisher: {
          '@type': 'Organization',
          name: 'Research Factors Inc.',
          url: 'https://researchfactors.com',
          logo: 'https://researchfactors.com/logo.png'
        }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://researchfactors.com/editorial-guidelines#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://researchfactors.com/'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Editorial Guidelines',
            item: 'https://researchfactors.com/editorial-guidelines'
          }
        ]
      }
    ]
  };

  const { data: seoResponse } = useQuery({
    queryKey: ['seo', 'page', 'editorial-guidelines'],
    queryFn: () => seoApi.resolveSeo({ type: 'PAGE', id: 'editorial-guidelines' }),
    staleTime: 1000 * 60 * 10
  });
  const pageSeo = seoResponse?.data || null;

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-rfblue-100 selection:text-rfblue-900">
      <SeoHead
        seo={pageSeo}
        title="Editorial Guidelines & Review Standards | Research Factors"
        description="Explore Research Factors editorial standards: empirical methodology, peer review verification, conflict-of-interest firewalls, and fact-checking protocols."
        canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/editorial-guidelines` : 'https://researchfactors.com/editorial-guidelines'}
        jsonLd={pageSeo?.schema?.jsonLd || jsonLd}
      />

      <Header />

      <main className="flex-1">
        {/* Document Hero Header */}
        <section className="py-10 sm:py-16 border-b border-paper-border bg-paper-warm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              {/* Breadcrumb Navigation */}
              <nav aria-label="Breadcrumbs" className="flex items-center space-x-2 text-xs sm:text-sm text-ink-light mb-4 flex-wrap">
                <Link to="/" className="hover:text-rfblue transition-colors">Home</Link>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="font-semibold text-ink-darkest">Editorial Guidelines</span>
              </nav>

              {/* <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-rfblue-50 text-rfblue border border-rfblue-100 mb-4 shadow-2xs">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Editorial Standards & Integrity</span>
              </div> */}

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-ink-darkest leading-tight">
                {page?.title || 'Editorial Guidelines & Review Standards'}
              </h1>

              <p className="mt-3 text-sm sm:text-base text-ink-muted leading-relaxed">
                {page?.subtitle || 'Empirical Rigor, Independence, and Peer-Reviewed Fact-Checking'}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-ink-light">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rfblue" />
                  <span>Last Updated: {page?.lastUpdated || 'September 25, 2026'}</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Peer-Reviewed Standards</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1 text-rfblue hover:underline cursor-pointer"
                  title="Print or save this document as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Quick-Jump Horizontal Navigation Bar (Visible only on < lg screens) */}
        {sections.length > 0 && (
          <div className="lg:hidden sticky top-16 z-20 bg-white/95 dark:bg-paper-card/95 backdrop-blur-md border-b border-paper-border py-2 px-4 shadow-xs">
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar scroll-smooth">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-light shrink-0 mr-1">
                Jump To:
              </span>
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(null, sec.id)}
                  className={`px-3 py-1 rounded-full text-xs shrink-0 transition-colors whitespace-nowrap ${activeSection === sec.id
                      ? 'bg-rfblue text-white font-semibold shadow-2xs'
                      : 'bg-paper-warm hover:bg-slate-100 text-ink-muted hover:text-ink-darkest border border-paper-border/60'
                    }`}
                >
                  {sec.number}. {sec.heading.split('&')[0].trim()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2-Column Content Layout (Left Sticky Navigation on Desktop, Right Manuscript) */}
        <section className="py-8 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Sticky Sidebar Table of Contents (Desktop Only) */}
              <aside className="hidden lg:block lg:col-span-4 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-3 py-1 scrollbar-thin">
                <div className="p-5 rounded-2xl bg-white dark:bg-paper-card border border-paper-border shadow-2xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-ink-darkest">
                      Table of Contents
                    </h3>
                    <p className="text-xs text-ink-light mt-0.5">
                      8 Standardized Sections
                    </p>
                  </div>

                  <nav className="space-y-1 text-sm">
                    {sections.map((sec) => (
                      <a
                        key={sec.id}
                        href={`#${sec.id}`}
                        onClick={(e) => scrollToSection(e, sec.id)}
                        className={`block py-1.5 px-2.5 rounded-lg transition-colors truncate ${activeSection === sec.id
                            ? 'bg-rfblue-50 text-rfblue font-semibold border-l-2 border-rfblue'
                            : 'text-ink-muted hover:text-ink-darkest hover:bg-paper'
                          }`}
                        title={`${sec.number}. ${sec.heading}`}
                      >
                        {sec.number}. {sec.heading}
                      </a>
                    ))}
                  </nav>

                  <div className="pt-4 border-t border-paper-border">
                    <div className="p-3.5 rounded-xl bg-paper-warm border border-paper-border text-sm space-y-2">
                      <div className="flex items-center space-x-1.5 font-bold text-ink-darkest">
                        <Scale className="w-3.5 h-3.5 text-rfblue" />
                        <span>Editorial Inquiries</span>
                      </div>
                      <p className="text-ink-muted text-sm leading-relaxed">
                        Have questions regarding our peer review or testing methodologies?
                      </p>
                      <Link
                        to="/contact"
                        className="inline-flex items-center text-sm font-semibold text-rfblue hover:underline"
                      >
                        <span>Contact Editorial Board</span>
                        <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Manuscript Body (Full Width on Mobile, 8 cols on Desktop) */}
              <article className="lg:col-span-8 max-w-3xl space-y-10 sm:space-y-12">
                {/* Introduction Banner */}
                {page?.intro && page.intro.length > 0 && (
                  <div className="p-5 sm:p-6 rounded-2xl bg-paper-warm border border-paper-border text-sm sm:text-base leading-relaxed space-y-3 text-ink shadow-2xs">
                    {page.intro.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                )}

                {/* Numbered Guideline Sections */}
                {sections.map((sec) => (
                  <section
                    key={sec.id}
                    id={sec.id}
                    className="scroll-mt-28 pt-8 border-t border-paper-border/80 first:border-t-0 first:pt-0"
                  >
                    {/* Section Header */}
                    <div className="flex items-baseline space-x-3 mb-4">
                      <span className="text-xs sm:text-base font-mono font-bold text-rfblue bg-rfblue-50 px-2 sm:px-2.5 py-0.5 rounded-md border border-rfblue-100 shrink-0">
                        {String(sec.number).padStart(2, '0')}
                      </span>
                      <h2 className="text-lg sm:text-2xl font-bold text-ink-darkest tracking-tight">
                        {sec.heading}
                      </h2>
                    </div>

                    {/* Section Content */}
                    <div className="space-y-4 text-sm sm:text-base text-ink leading-relaxed">
                      {sec.paragraphs?.map((para, pIdx) => (
                        <p key={pIdx}>{para}</p>
                      ))}

                      {/* Subsections Cards */}
                      {sec.subSections && sec.subSections.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 my-4">
                          {sec.subSections.map((sub, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-4 rounded-xl bg-white dark:bg-paper-card border border-paper-border shadow-2xs flex flex-col justify-between"
                            >
                              <div>
                                <h4 className="text-xs sm:text-sm font-bold text-ink-darkest flex items-center">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5 shrink-0" />
                                  <span>{sub.title}</span>
                                </h4>
                                <p className="text-xs text-ink-muted mt-2 leading-relaxed">
                                  {sub.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Bulleted Directives */}
                      {sec.bullets && sec.bullets.length > 0 && (
                        <div className="bg-white dark:bg-paper-card rounded-xl border border-paper-border/80 p-4 sm:p-5 my-3 shadow-2xs">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-ink-light mb-3">
                            Key Requirements & Operational Directives
                          </h4>
                          <ul className="space-y-2.5 pl-1 text-xs sm:text-sm text-ink-darkest">
                            {sec.bullets.map((bullet, bIdx) => (
                              <li key={bIdx} className="flex items-start space-x-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-rfblue mt-2 shrink-0" />
                                <span className="leading-relaxed">{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </section>
                ))}

                {/* Editorial Inquiries & Errata Reporting Footer Card */}
                <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#060D1A] via-[#0F172A] to-[#1E3A8A] text-white shadow-md border border-slate-800 space-y-4">
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/15">
                    <Mail className="w-3 h-3 text-rfblue-300" />
                    <span>Public Errata & Feedback</span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-white leading-snug">
                    Reporting Corrections or Inaccuracies
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                    If you detect a factual error, distorted citation, uncredited attribution, or conflicting benchmark in any Research Factors article, please notify our independent editorial ombudsman with supporting primary documentation.
                  </p>
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <a
                      href="mailto:errata@researchfactors.com?subject=Editorial%20Correction%20Request"
                      className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-rfblue hover:bg-rfblue-600 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Submit Errata (errata@researchfactors.com)</span>
                    </a>
                    <Link
                      to="/contact"
                      className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-full text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/20 transition-colors cursor-pointer"
                    >
                      <span>Contact Editorial Board</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
