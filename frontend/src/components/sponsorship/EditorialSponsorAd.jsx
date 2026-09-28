import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, BarChart3, Award } from 'lucide-react';

export function EditorialSponsorAd({ className = '' }) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-white via-rfblue-50/25 to-rfblue-50/50 rounded-2xl border border-rfblue/20 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-300 ${className}`}
    >
      {/* Decorative subtle accent shape */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-rfblue/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Badge */}
      <div className="flex items-center justify-between mb-3.5">
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-rfblue/10 text-rfblue border border-rfblue/20">
          <Sparkles className="w-3 h-3 text-rfblue" />
          <span>Partner Spotlight</span>
        </span>
        <span className="text-[11px] font-medium text-ink-light uppercase tracking-wider">
          Sponsored
        </span>
      </div>

      {/* Main Copy */}
      <h3 className="text-base sm:text-lg font-bold text-ink-darkest leading-snug tracking-tight mb-2">
        Commission Rigorous Empirical Research & Benchmarks
      </h3>
      <p className="text-xs sm:text-sm text-ink-muted leading-relaxed mb-4">
        Reach 100k+ technical leaders, researchers, and enterprise decision-makers with transparent, peer-reviewed studies.
      </p>

      {/* Key Proof Points */}
      <div className="grid grid-cols-1 gap-2 mb-5 pt-3 border-t border-rfblue/10 text-xs text-ink">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-rfblue shrink-0" />
          <span>Independent editorial governance & ethics</span>
        </div>
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-3.5 h-3.5 text-rfblue shrink-0" />
          <span>Empirical multi-variable benchmarking</span>
        </div>
      </div>

      {/* CTA Button */}
      <Link
        to="/sponsorship"
        className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rfblue hover:bg-rfblue-700 active:bg-rfblue-800 transition-all shadow-xs group"
      >
        <span>Explore Sponsorship Desk</span>
        <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
