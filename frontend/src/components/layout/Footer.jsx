import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { LOGO_URL } from '../../services/media.api.js';

export function Footer() {
  return (
    <footer className="border-t border-paper-border bg-white text-ink py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-8 sm:gap-10 lg:gap-12">
          {/* Brand Info (Full width on mobile, 2 Columns on large screens) */}
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block group py-1">
              <img
                src={LOGO_URL}
                alt="Research Factors"
                className="h-10 sm:h-11 w-auto object-contain transition-opacity duration-200 group-hover:opacity-90"
              />
            </Link>
            <p className="text-sm sm:text-base text-ink-muted leading-relaxed max-w-sm font-normal">
              An open, research-focused publishing platform for analysis, comparisons, reviews, and informed discussion.
            </p>
            {/* <div className="pt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-md text-xs sm:text-sm font-semibold bg-rfblue-50 text-rfblue border border-rfblue-100">
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                Editorial Independence
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-md text-xs sm:text-sm font-semibold bg-paper text-ink-muted border border-paper-border">
                <Sparkles className="w-4 h-4 mr-1.5 text-rfblue" />
                Evidence-Led Analysis
              </span>
            </div> */}
          </div>

          {/* Col 1: Explore */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-darkest mb-4">
              Explore
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-ink-muted">
              <li>
                <Link to="/research" className="hover:text-rfblue transition-colors">
                  All Research
                </Link>
              </li>
              <li>
                <Link to="/research?sort=popular" className="hover:text-rfblue transition-colors">
                  Trending Articles
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-rfblue transition-colors">
                  About Platform
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-rfblue transition-colors">
                  Contact Editorial
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Research Domains */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-darkest mb-4">
              Research Domains
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-ink-muted">
              <li>
                <Link to="/research?category=technology" className="hover:text-rfblue transition-colors">
                  Technology
                </Link>
              </li>
              <li>
                <Link to="/research?category=business" className="hover:text-rfblue transition-colors">
                  Business
                </Link>
              </li>
              <li>
                <Link to="/research?category=science" className="hover:text-rfblue transition-colors">
                  Science
                </Link>
              </li>
              <li>
                <Link to="/research?category=finance" className="hover:text-rfblue transition-colors">
                  Finance
                </Link>
              </li>
              <li>
                <Link to="/research?category=lifestyle" className="hover:text-rfblue transition-colors">
                  Lifestyle
                </Link>
              </li>
              <li>
                <Link to="/research?category=policy" className="hover:text-rfblue transition-colors">
                  Consumer & Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: For Authors */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-darkest mb-4">
              For Authors
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-ink-muted">
              <li>
                <Link to="/register" className="hover:text-rfblue transition-colors">
                  Become an Author
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-rfblue transition-colors">
                  Editorial Standards
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-rfblue transition-colors">
                  Submit Research Pitch
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-rfblue transition-colors">
                  Author Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: For Brands */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-darkest mb-4">
              For Brands
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-ink-muted">
              <li>
                <Link to="/sponsorship" className="hover:text-rfblue transition-colors font-medium text-rfblue">
                  Sponsorship Overview
                </Link>
              </li>
              <li>
                <Link to="/sponsorship#sponsorship-formats" className="hover:text-rfblue transition-colors">
                  Sponsorship Formats
                </Link>
              </li>
              <li>
                <Link to="/sponsorship#faqs" className="hover:text-rfblue transition-colors">
                  Sponsorship FAQs
                </Link>
              </li>
              <li>
                <Link to="/sponsorship#inquiry-form" className="hover:text-rfblue transition-colors">
                  Submit Brand Inquiry
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Links & Copyright */}
        <div className="mt-14 pt-8 border-t border-paper-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs sm:text-sm text-ink-light">
          <p className="leading-relaxed text-center text-[11px] sm:text-sm">
            © {new Date().getFullYear()} Research Factors. Research. Read. Share. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 sm:text-sm">
            <Link to="/about" className="hover:text-ink transition-colors">About</Link>
            <Link to="/contact" className="hover:text-ink transition-colors">Contact</Link>
            <Link to="/privacy-policy" className="hover:text-ink transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-ink transition-colors">Terms of Service</Link>
            <Link to="/cookie-policy" className="hover:text-ink transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
