import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import { usePageContent } from '../../services/pages.api.js';
import { seoApi } from '../../services/seo.api.js';
import { SeoHead } from '../../components/common/SeoHead.jsx';
import {
  Cookie,
  Calendar,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  ExternalLink,
  Layers
} from 'lucide-react';

export default function CookiePolicyPage() {
  const { data: page } = usePageContent('cookie-policy');
  const [activeSection, setActiveSection] = useState('what-are-cookies');

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
    name: 'Cookie Policy — Research Factors',
    description:
      'The Cookie Policy for Research Factors explaining essential, preference, analytics, and advertising cookies and user management controls.',
    url: 'https://researchfactors.com/cookie-policy',
    publisher: {
      '@type': 'Organization',
      name: 'Research Factors Inc.',
      url: 'https://researchfactors.com'
    }
  };

  const { data: seoData } = useQuery({
    queryKey: ['seo', 'PAGE', 'cookie-policy'],
    queryFn: () => seoApi.resolveSeo({ type: 'PAGE', id: 'cookie-policy' }),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-rfblue-100 selection:text-rfblue-900">
      <SeoHead
        seo={seoData?.seo}
        fallbackTitle="Cookie Policy | Research Factors"
        fallbackDescription="Learn about the cookies and tracking technologies used by Research Factors, their purposes, and how to manage your cookie preferences."
        canonicalUrl={`${window.location.origin}/cookie-policy`}
      />

      <Header />

      <main className="flex-1">
        {/* Document Header */}
        <section className="py-12 sm:py-16 border-b border-paper-border bg-paper-warm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-rfblue-50 text-rfblue border border-rfblue-100 mb-4 shadow-2xs">
                <Cookie className="w-3.5 h-3.5" />
                <span>Cookies & Tracking Controls</span>
              </div>

              <h1 className="text-ink-darkest">
                Cookie Policy
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-ink-light">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rfblue" />
                  <span>Last Updated: {page?.lastUpdated || 'September 22, 2026'}</span>
                </div>
                <span>•</span>
                <span>Transparent Usage Disclosures</span>
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
                {/* Introductory Banner */}
                <div className="p-6 rounded-2xl bg-paper-warm border border-paper-border text-sm leading-relaxed space-y-3 text-ink">
                  {page?.intro?.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                {/* Numbered Sections */}
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

                      {/* Render Subsections if present */}
                      {sec.subSections && sec.subSections.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                          {sec.subSections.map((sub, sIdx) => (
                            <div key={sIdx} className="p-4 rounded-xl bg-white border border-paper-border/80 shadow-2xs flex flex-col justify-between">
                              <div>
                                <h4 className="text-sm font-bold text-ink-darkest">{sub.title}</h4>
                                <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">
                                  {sub.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Render Bullets if present */}
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

                {/* Browser Controls Info Box */}
                <div className="p-6 rounded-2xl bg-white border border-paper-border shadow-2xs space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-rfblue">
                    <Sliders className="w-4 h-4 text-rfblue" />
                    <span>How to Clear or Manage Browser Cookies</span>
                  </div>
                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                    You can manage cookie settings directly in your browser. Consult your browser's official documentation for instructions on configuring third-party cookie blocking:
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2 text-xs">
                    {['Google Chrome', 'Mozilla Firefox', 'Apple Safari', 'Microsoft Edge'].map((browser, b) => (
                      <span
                        key={b}
                        className="px-3 py-1 rounded-lg bg-paper-warm border border-paper-border text-ink-darkest font-medium"
                      >
                        {browser}
                      </span>
                    ))}
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
