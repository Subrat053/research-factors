import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-paper-border bg-white text-ink py-16 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="inline-block group py-1">
              <img
                src="/logo.png"
                alt="Research Factors"
                className="h-9 w-auto object-contain transition-opacity duration-200 group-hover:opacity-90"
              />
            </Link>
            <p className="text-sm text-ink-muted leading-relaxed max-w-sm font-light">
              An open, rigorous digital publishing platform dedicated to empirical benchmarks, technical reviews, comparative analysis, and academic community discourse.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rfblue-50 text-rfblue border border-rfblue-100">
                Peer-Reviewed Editorial Standards
              </span>
            </div>
          </div>

          {/* Nav Col 1 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-ink-darkest mb-4">
              Research Domains
            </h4>
            <ul className="space-y-2.5 text-sm text-ink-muted">
              <li>
                <Link to="/research?category=technology" className="hover:text-rfblue transition-colors">
                  Technology & Silicon
                </Link>
              </li>
              <li>
                <Link to="/research?category=science" className="hover:text-rfblue transition-colors">
                  Physical Sciences
                </Link>
              </li>
              <li>
                <Link to="/research?category=economics" className="hover:text-rfblue transition-colors">
                  Macroeconomics
                </Link>
              </li>
              <li>
                <Link to="/research?category=policy" className="hover:text-rfblue transition-colors">
                  Governance & Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav Col 2 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-ink-darkest mb-4">
              Editorial Policy
            </h4>
            <ul className="space-y-2.5 text-sm text-ink-muted">
              <li>
                <Link to="/about" className="hover:text-rfblue transition-colors">
                  About the Platform
                </Link>
              </li>
              <li>
                <Link to="/editorial-policy" className="hover:text-rfblue transition-colors">
                  Editorial Standards
                </Link>
              </li>
              <li>
                <Link to="/community-guidelines" className="hover:text-rfblue transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="hover:text-rfblue transition-colors">
                  Research Disclaimer
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav Col 3 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-ink-darkest mb-4">
              Authors & Writing
            </h4>
            <ul className="space-y-2.5 text-sm text-ink-muted">
              <li>
                <Link to="/register" className="hover:text-rfblue transition-colors">
                  Become an Author
                </Link>
              </li>
              <li>
                <Link to="/authors" className="hover:text-rfblue transition-colors">
                  Author Directory
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-rfblue transition-colors">
                  Contact Editorial Board
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-paper-border flex flex-col sm:flex-row items-center justify-between text-xs text-ink-light space-y-4 sm:space-y-0">
          <p>© {new Date().getFullYear()} Research Factors. Research. Read. Share. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link to="/privacy-policy" className="hover:text-ink transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-ink transition-colors">Terms of Service</Link>
            <Link to="/cookie-policy" className="hover:text-ink transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
