import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { articlesApi } from '../../services/articles.api.js';
import { LOGO_WHITE_URL } from '../../services/media.api.js';
import {
  ShieldCheck,
  Search,
  Users,
  ArrowRight,
  Mail,
  Quote,
  CheckCircle2,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Rss
} from 'lucide-react';

export function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Dynamic public categories query (with 10m cache)
  const { data: categoriesResponse } = useQuery({
    queryKey: ['public-footer-categories'],
    queryFn: () => articlesApi.getCategories(),
    staleTime: 1000 * 60 * 10
  });

  const categories = useMemo(() => {
    const raw = categoriesResponse?.data || categoriesResponse || [];
    if (!Array.isArray(raw)) return [];
    // Only display active categories that the admin configured for footer display
    return raw.filter((c) => c.isActive !== false && c.showInFooter !== false);
  }, [categoriesResponse]);

  // Fallback editorial categories if offline or initial load
  const displayCategories = useMemo(() => {
    if (categories.length > 0) return categories;
    return [
      { name: 'Technology', slug: 'technology' },
      { name: 'Business', slug: 'business' },
      { name: 'Economics', slug: 'economics' },
      { name: 'Policy', slug: 'policy' },
      { name: 'Science', slug: 'science' },
      { name: 'Lifestyle', slug: 'lifestyle' }
    ];
  }, [categories]);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => {
        setNewsletterSubscribed(false);
      }, 5000);
    }
  };

  return (
    <footer className="bg-[#060D1A] text-slate-300 pt-16 sm:pt-20 pb-12 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* TIER 1: BRAND MASTHEAD & 5-COLUMN DIRECTORY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12">
          {/* Column 1: Brand & Ethos (3 cols on desktop) */}
          <div className="sm:col-span-2 lg:col-span-3 space-y-4">
            <Link to="/" className="inline-block py-1">
              <img
                src={LOGO_WHITE_URL}
                alt="Research Factors"
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </Link>

            {/* <h3 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight pt-1">
              Real Research. Better Decisions.
            </h3> */}

            <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed font-normal">
              We research, compare and analyze the latest trends, tools and solutions to help you make smarter,
              evidence-based decisions. From product reviews to expert insights, our content is built for curious minds
              and forward thinkers.
            </p>


          </div>

          {/* Column 2: EXPLORE (2 cols on desktop) */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-100 inline-block pb-1.5 border-b-2 border-blue-500">
                Explore
              </h4>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link
                  to="/"
                  className="border-l-2 border-transparent hover:border-blue-500 active:border-blue-400 pl-0 hover:pl-2.5 text-slate-300 hover:text-white active:text-blue-200 transition-all duration-200 block py-0.5"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/research"
                  className="border-l-2 border-transparent hover:border-blue-500 active:border-blue-400 pl-0 hover:pl-2.5 text-slate-300 hover:text-white active:text-blue-200 transition-all duration-200 block py-0.5"
                >
                  Research Library
                </Link>
              </li>
              <li>
                <Link
                  to="/research?type=REVIEW"
                  className="border-l-2 border-transparent hover:border-blue-500 active:border-blue-400 pl-0 hover:pl-2.5 text-slate-300 hover:text-white active:text-blue-200 transition-all duration-200 block py-0.5"
                >
                  Reviews
                </Link>
              </li>
              <li>
                <Link
                  to="/research?type=COMPARISON"
                  className="border-l-2 border-transparent hover:border-blue-500 active:border-blue-400 pl-0 hover:pl-2.5 text-slate-300 hover:text-white active:text-blue-200 transition-all duration-200 block py-0.5"
                >
                  Comparisons
                </Link>
              </li>
              <li>
                <Link
                  to="/research?sort=popular"
                  className="border-l-2 border-transparent hover:border-blue-500 active:border-blue-400 pl-0 hover:pl-2.5 text-slate-300 hover:text-white active:text-blue-200 transition-all duration-200 block py-0.5"
                >
                  Trending
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="border-l-2 border-transparent hover:border-blue-500 active:border-blue-400 pl-0 hover:pl-2.5 text-slate-300 hover:text-white active:text-blue-200 transition-all duration-200 block py-0.5"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: CATEGORIES (2 cols on desktop) */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-100 inline-block pb-1.5 border-b-2 border-blue-500">
                Categories
              </h4>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm">
              {displayCategories.map((cat) => (
                <li key={cat.id || cat.slug}>
                  <Link
                    to={`/categories/${cat.slug}`}
                    className="border-l-2 border-transparent hover:border-blue-500 active:border-blue-400 pl-0 hover:pl-2.5 text-slate-300 hover:text-white active:text-blue-200 transition-all duration-200 block py-0.5 truncate"
                    title={cat.name}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: COMPANY (2 cols on desktop) */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-100 inline-block pb-1.5 border-b-2 border-blue-500">
                Company
              </h4>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link
                  to="/contact"
                  className="border-l-2 border-transparent hover:border-blue-500 active:border-blue-400 pl-0 hover:pl-2.5 text-slate-300 hover:text-white active:text-blue-200 transition-all duration-200 block py-0.5"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/sponsorship"
                  className="border-l-2 border-transparent hover:border-blue-500 active:border-blue-400 pl-0 hover:pl-2.5 text-slate-300 hover:text-white active:text-blue-200 transition-all duration-200 block py-0.5"
                >
                  Sponsorship
                </Link>
              </li>
              <li>
                <Link
                  to="/sponsorship#tiers"
                  className="border-l-2 border-transparent hover:border-blue-500 active:border-blue-400 pl-0 hover:pl-2.5 text-slate-300 hover:text-white active:text-blue-200 transition-all duration-200 block py-0.5"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="border-l-2 border-transparent hover:border-blue-500 active:border-blue-400 pl-0 hover:pl-2.5 text-slate-300 hover:text-white active:text-blue-200 transition-all duration-200 block py-0.5"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="border-l-2 border-transparent hover:border-blue-500 active:border-blue-400 pl-0 hover:pl-2.5 text-slate-300 hover:text-white active:text-blue-200 transition-all duration-200 block py-0.5"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/editorial-guidelines"
                  className="border-l-2 border-transparent hover:border-blue-500 active:border-blue-400 pl-0 hover:pl-2.5 text-slate-300 hover:text-white active:text-blue-200 transition-all duration-200 block py-0.5"
                >
                  Editorial Guidelines
                </Link>
              </li>
              {/* <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-l-2 border-transparent hover:border-blue-500 active:border-blue-400 pl-0 hover:pl-2.5 text-slate-300 hover:text-white active:text-blue-200 transition-all duration-200 block py-0.5"
                >
                  Sitemap (XML)
                </a>
              </li> */}
            </ul>
          </div>

          {/* Column 5: STAY UPDATED (3 cols on desktop) */}
          <div className="sm:col-span-2 lg:col-span-3 space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-100 inline-block pb-1.5 border-b-2 border-blue-500">
                Stay Updated
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed font-normal">
              Get the latest research, reviews and insights delivered to your inbox. No spam, just useful updates.
            </p>

            {newsletterSubscribed ? (
              <div className="p-3 rounded-full bg-blue-950/80 border border-blue-500/40 text-xs text-blue-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Thank you for subscribing!</span>
              </div>
            ) : (
              <form
                onSubmit={handleNewsletterSubmit}
                className="relative rounded-full bg-slate-900/90 border border-slate-700/80 focus-within:border-blue-500 flex items-center p-1 transition-colors"
              >
                <Mail className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none flex-1 px-3 py-1.5 min-w-0"
                />
                <button
                  type="submit"
                  className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer shadow-xs"
                  title="Subscribe to Newsletter"
                  aria-label="Subscribe to Newsletter"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Social Channels Row */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm shadow-[#1877F2]/40 hover:brightness-110"
                aria-label="Facebook"
                title="Facebook"
              >
                <Facebook className="w-4 h-4 fill-current" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm shadow-[#DD2A7B]/40 hover:brightness-110"
                aria-label="Instagram"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm shadow-[#1DA1F2]/40 hover:brightness-110"
                aria-label="X (Twitter)"
                title="X (Twitter)"
              >
                <Twitter className="w-4 h-4 fill-current" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#FF0000] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm shadow-[#FF0000]/40 hover:brightness-110"
                aria-label="YouTube"
                title="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* TIER 2: TRUST VERIFICATION CARDS & EDITORIAL CREED */}
        <div className="pt-10 pb-8 border-t border-slate-800/80 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 3 Trust Verification Signals (8 columns on desktop) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            <div className="flex items-center gap-3.5 p-3.5 sm:p-4 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs sm:text-[15px] sm:mb-0.5 font-semibold text-white tracking-tight truncate">
                  Verified Information
                </h5>
                <p className="text-[11px] sm:text-sm text-slate-400 font-normal truncate">
                  Evidence-backed data
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-lg transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Search className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs sm:text-[15px] font-semibold text-white tracking-tight truncate sm:mb-0.5">
                  Independent Analysis
                </h5>
                <p className="text-[11px] sm:text-sm text-slate-400 font-normal truncate">
                  Objective evaluations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 sm:p-4 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs sm:text-[15px] sm:mb-0.5 font-semibold text-white tracking-tight truncate">
                  Real User Perspectives
                </h5>
                <p className="text-[11px] sm:text-sm text-slate-400 font-normal truncate">
                  Practitioner insights
                </p>
              </div>
            </div>
          </div>

          {/* Editorial Quote Creed (4 columns on desktop) */}
          <div className="lg:col-span-4 flex flex-col justify-center border-l-0 lg:border-l lg:border-slate-800/80 lg:pl-8 py-1">
            <Quote className="w-5 h-5 text-blue-400 rotate-180 mb-2 opacity-80" />
            <blockquote className="font-serif italic text-sm sm:text-base text-slate-200 leading-snug mb-1">
              “Better information leads to better decisions.”
            </blockquote>
            <cite className="not-italic text-[11px] sm:text-xs text-slate-400 font-medium">
              — Research Factors
            </cite>
          </div>
        </div>

        {/* TIER 3: SUB-FOOTER BASELINE */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="text-center sm:text-left text-[11px] sm:text-sm text-slate-400">
            © {new Date().getFullYear()} Research Factors. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 text-[11px] sm:text-sm text-slate-400">
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors duration-200 underline-offset-2 hover:underline"
              title="XML Sitemap Index"
            >
              Sitemap
            </a>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <p className="tracking-wide">
              Research. Compare. Choose Better.
            </p>
          </div>
        </div>
      </div>
    </footer >
  );
}
