import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import { usePageContent } from '../../services/pages.api.js';
import {
  FileText,
  ShieldAlert,
  ChevronRight,
  Printer,
  Calendar,
  Building2,
  CheckCircle2
} from 'lucide-react';

export default function TermsPage() {
  const { data: page } = usePageContent('terms');
  const [activeSection, setActiveSection] = useState('about-research-factors');

  const sections = page?.sections || [];

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
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -100;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms & Conditions — Research Factors',
    description:
      'The Terms & Conditions governing access, editorial research usage, peer review submissions, and legal disclaimers for Research Factors.',
    url: 'https://researchfactors.com/terms',
    publisher: {
      '@type': 'Organization',
      name: 'Research Factors Inc.',
      url: 'https://researchfactors.com'
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-rfblue-100 selection:text-rfblue-900">
      <Helmet>
        <title>Terms & Conditions | Research Factors</title>
        <meta
          name="description"
          content="Review the terms and conditions governing the use of Research Factors, including content usage, user submissions, intellectual property, and disclaimers."
        />
        <link rel="canonical" href="https://researchfactors.com/terms" />
        <meta property="og:title" content="Terms & Conditions | Research Factors" />
        <meta
          property="og:description"
          content="Governing terms, editorial usage, and reader community agreements for Research Factors."
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://researchfactors.com/terms" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Terms & Conditions | Research Factors" />
        <meta
          name="twitter:description"
          content="Review the governing legal terms and conditions for Research Factors."
        />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Header />

      <main className="flex-1">
        {/* Document Header */}
        <section className="py-12 sm:py-16 border-b border-paper-border bg-paper-warm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-rfblue-50 text-rfblue border border-rfblue-100 mb-4 shadow-2xs">
                <FileText className="w-3.5 h-3.5" />
                <span>Legal Agreement</span>
              </div>

              <h1 className="text-ink-darkest">
                Terms & Conditions
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-ink-light">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rfblue" />
                  <span>Last Updated: {page?.lastUpdated || 'September 22, 2026'}</span>
                </div>
                <span>•</span>
                <span>Governing Jurisdiction: India</span>
                <span>•</span>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1 text-rfblue hover:underline cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section with Sticky Desktop Navigation */}
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              {/* Sticky Sidebar Table of Contents (Desktop) */}
              <aside className="hidden lg:block lg:col-span-4 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-3 py-2 scrollbar-thin">
                <div className="p-5 rounded-2xl bg-white border border-paper-border shadow-2xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-darkest mb-4">
                    Table of Contents
                  </h3>
                  <nav className="space-y-1 text-xs">
                    {sections.map((sec) => (
                      <a
                        key={sec.id}
                        href={`#${sec.id}`}
                        onClick={(e) => scrollToSection(e, sec.id)}
                        className={`block py-1.5 px-2.5 rounded-lg transition-colors truncate ${
                          activeSection === sec.id
                            ? 'bg-rfblue-50 text-rfblue font-semibold border-l-2 border-rfblue'
                            : 'text-ink-muted hover:text-ink-darkest hover:bg-paper'
                        }`}
                      >
                        {sec.number}. {sec.heading}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Main Document Body */}
              <article className="lg:col-span-8 max-w-3xl space-y-12">
                {/* Introductory Disclaimer */}
                <div className="p-6 rounded-2xl bg-paper-warm border border-paper-border text-sm leading-relaxed space-y-3 text-ink">
                  {page?.intro?.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                {/* Numbered Clauses */}
                {sections.map((sec) => (
                  <section
                    key={sec.id}
                    id={sec.id}
                    className="scroll-mt-28 pt-8 border-t border-paper-border/80 first:border-t-0 first:pt-0"
                  >
                    <div className="flex items-baseline space-x-3 mb-4">
                      <span className="text-sm font-mono font-bold text-rfblue bg-rfblue-50 px-2 py-0.5 rounded-md border border-rfblue-100">
                        {String(sec.number).padStart(2, '0')}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold text-ink-darkest">
                        {sec.heading}
                      </h2>
                    </div>

                    <div className="space-y-4 text-sm sm:text-base text-ink leading-relaxed">
                      {sec.paragraphs?.map((para, pIdx) => (
                        <p key={pIdx}>{para}</p>
                      ))}

                      {sec.bullets && sec.bullets.length > 0 && (
                        <ul className="my-3 space-y-2 pl-4 list-disc marker:text-rfblue text-sm text-ink-darkest font-normal">
                          {sec.bullets.map((bullet, bIdx) => (
                            <li key={bIdx}>{bullet}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>
                ))}

                {/* Final Acceptance Banner */}
                <div className="p-6 rounded-2xl bg-white border border-paper-border shadow-2xs space-y-3 text-center sm:text-left">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Agreement Confirmation</span>
                  </div>
                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                    By using Research Factors, you acknowledge that you have read, understood, and agreed to be bound by these Terms & Conditions.
                  </p>
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
