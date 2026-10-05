import React from 'react';
import {
  Database,
  Megaphone,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Cpu,
  BarChart3
} from 'lucide-react';

export function ArticleResearchDataTab({
  article,
  onChange
}) {
  return (
    <div className="space-y-6">
      {/* 1. EMPIRICAL BENCHMARKS & METHODOLOGY DISCLOSURE */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-base font-bold uppercase tracking-normal text-slate-700 dark:text-slate-300">
              Empirical Methodology & Experimental Parameters
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Document test rigs, baseline conditions, datasets, and reproduction guidelines for peer scrutiny
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Testing Environment / Hardware Baseline
            </label>
            <input
              type="text"
              value={article.methodologyEnvironment || ''}
              onChange={(e) => onChange('methodologyEnvironment', e.target.value)}
              placeholder="e.g. NVIDIA H100 80GB SXM5, PyTorch 2.4, CUDA 12.4"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Sample Size / Observation Trials (N)
            </label>
            <input
              type="text"
              value={article.sampleSize || ''}
              onChange={(e) => onChange('sampleSize', e.target.value)}
              placeholder="e.g. N = 10,000 runs, 5-fold cross validation"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Dataset Origin & Open Access Repository URL
          </label>
          <input
            type="url"
            value={article.datasetUrl || ''}
            onChange={(e) => onChange('datasetUrl', e.target.value)}
            placeholder="https://huggingface.co/datasets/... or https://zenodo.org/record/..."
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Methodology & Limitations Statement
          </label>
          <textarea
            value={article.methodologyNotes || ''}
            onChange={(e) => onChange('methodologyNotes', e.target.value)}
            placeholder="Explain experimental protocol, error margins, statistical significance (p < 0.01), and any known confounding variables..."
            rows={3}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 leading-relaxed"
          />
        </div>
      </div>

      {/* 2. BRAND SPONSORSHIP & COMMERCIAL DISCLOSURE */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-5 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center space-x-2">
            <Megaphone className="w-4 h-4 sm:w-8 sm:h-8 text-[#c25e34] dark:text-[#f87171]" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Brand Sponsorship & Commercial Underwriting
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Disclose sponsoring organizations or commercial underwriting for this publication
              </p>
            </div>
          </div>
        </div>

        {/* Sponsorship Active Toggle */}
        <div>
          <label className="inline-flex items-center space-x-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(article.isSponsored)}
              onChange={(e) => onChange('isSponsored', e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 cursor-pointer"
            />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              This article is sponsored or commercially underwritten
            </span>
          </label>
        </div>

        {/* Conditional Sponsorship Input Fields */}
        {article.isSponsored && (
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sponsor / Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={article.sponsorName || ''}
                  onChange={(e) => onChange('sponsorName', e.target.value)}
                  placeholder="e.g. Quantum Computing Institute"
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sponsor Target Action URL (Website / Offer link)
                </label>
                <input
                  type="url"
                  value={article.sponsorUrl || ''}
                  onChange={(e) => onChange('sponsorUrl', e.target.value)}
                  placeholder="https://sponsor.example.com/research-initiative"
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Sponsor Partnership Statement / Description
              </label>
              <textarea
                value={article.sponsorDescription || ''}
                onChange={(e) => onChange('sponsorDescription', e.target.value)}
                placeholder="Disclose nature of collaboration or sponsorship..."
                rows={3}
                className="w-full text-sm p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Sponsor Logo URL (Optional)
              </label>
              <input
                type="url"
                value={article.sponsorLogoUrl || ''}
                onChange={(e) => onChange('sponsorLogoUrl', e.target.value)}
                placeholder="https://... (Direct logo image URL)"
                className="w-full text-sm p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
              />
            </div>

            {/* Live Sponsorship Sidebar Preview Widget */}
            <div className="pt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                Right Sidebar Card Preview
              </span>
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs max-w-sm space-y-3">
                <span className="text-[11px] font-bold tracking-widest text-[#0f5466] dark:text-[#5eead4] uppercase block">
                  SPONSORED
                </span>
                <h4 className="font-serif text-xl font-bold text-slate-900 dark:text-white leading-snug">
                  {article.sponsorName || 'Sponsor Name'}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {article.sponsorDescription || 'Sponsor partnership statement and description will be displayed here.'}
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-[#0f5466] shadow-2xs">
                    Visit Sponsor
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
