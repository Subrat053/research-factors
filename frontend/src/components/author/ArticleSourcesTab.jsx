import React from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  ExternalLink,
  MoveUp,
  MoveDown,
  Quote
} from 'lucide-react';

export function ArticleSourcesTab({
  article,
  onChange
}) {
  const sources = Array.isArray(article.sources) ? article.sources : [];

  const updateSources = (newSources) => {
    onChange('sources', newSources);
  };

  const handleAddSource = () => {
    const newSource = {
      id: `src-${Date.now()}`,
      title: '',
      authors: '',
      journal: '',
      year: new Date().getFullYear().toString(),
      doi: '',
      url: ''
    };
    updateSources([...sources, newSource]);
  };

  const handleUpdateSource = (index, field, value) => {
    const next = [...sources];
    next[index] = { ...next[index], [field]: value };
    updateSources(next);
  };

  const handleRemoveSource = (index) => {
    const next = sources.filter((_, i) => i !== index);
    updateSources(next);
  };

  const handleMoveSource = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= sources.length) return;
    const next = [...sources];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    updateSources(next);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-5 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Literature Citations & Bibliographic Sources
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Formal scholarly references, journal papers, and primary research sources cited in this manuscript
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddSource}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Citation</span>
          </button>
        </div>

        {sources.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/30">
            <Quote className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              No bibliographic citations added yet. Adding citations increases manuscript authority and reader trust.
            </p>
            <button
              type="button"
              onClick={handleAddSource}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              + Add First Citation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sources.map((src, idx) => (
              <div
                key={src.id || idx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-blue-600 dark:text-blue-400">
                    [{idx + 1}] Citation Entry
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleMoveSource(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-25"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveSource(idx, 1)}
                      disabled={idx === sources.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-25"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSource(idx)}
                      className="p-1 text-slate-400 hover:text-red-500 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-8">
                    <input
                      type="text"
                      value={src.title || ''}
                      onChange={(e) => handleUpdateSource(idx, 'title', e.target.value)}
                      placeholder="Publication or Paper Title (e.g. Quantum supremacy using a programmable superconducting processor)..."
                      className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <input
                      type="text"
                      value={src.authors || ''}
                      onChange={(e) => handleUpdateSource(idx, 'authors', e.target.value)}
                      placeholder="Authors (e.g. Arute, F., Arya, K., et al.)"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <input
                      type="text"
                      value={src.journal || ''}
                      onChange={(e) => handleUpdateSource(idx, 'journal', e.target.value)}
                      placeholder="Journal / Venue (e.g. Nature 574)"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={src.year || ''}
                      onChange={(e) => handleUpdateSource(idx, 'year', e.target.value)}
                      placeholder="Year (e.g. 2026)"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-6">
                    <input
                      type="url"
                      value={src.url || ''}
                      onChange={(e) => handleUpdateSource(idx, 'url', e.target.value)}
                      placeholder="DOI / Direct Link (e.g. https://doi.org/...)"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
