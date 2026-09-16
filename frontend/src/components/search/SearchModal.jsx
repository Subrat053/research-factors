import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, ArrowRight, BookOpen } from 'lucide-react';
import { articlesApi } from '../../services/articles.api.js';

export function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await articlesApi.search(query.trim());
        setResults(res.data || []);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (slug) => {
    onClose();
    navigate(`/research/${slug}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-darkest/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative mx-auto max-w-2xl transform rounded-2xl bg-white shadow-2xl border border-paper-border transition-all overflow-hidden">
        {/* Search Bar */}
        <div className="relative flex items-center border-b border-paper-border px-4 py-3.5">
          <Search className="w-5 h-5 text-ink-light mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search research, analysis, topics, or authors..."
            className="w-full bg-transparent text-sm text-ink placeholder-ink-light focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-ink-light hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-3 px-2 py-0.5 text-xs font-semibold text-ink-light bg-paper border border-paper-border rounded">
            ESC
          </kbd>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto p-2">
          {isLoading ? (
            <div className="py-12 text-center text-ink-muted flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-rfblue" />
              <span className="text-sm">Searching research catalog...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((article) => (
                <div
                  key={article.id}
                  onClick={() => handleSelect(article.slug)}
                  className="group flex items-start justify-between p-3 rounded-xl hover:bg-paper cursor-pointer transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-rfblue-50 text-rfblue flex items-center justify-center shrink-0 mt-0.5 border border-rfblue-100">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        {article.category && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rfblue">
                            {article.category.name}
                          </span>
                        )}
                        <span className="text-[10px] text-ink-light">• {article.readingTimeMin} min read</span>
                      </div>
                      <h4 className="text-sm font-serif font-bold text-ink-darkest group-hover:text-rfblue transition-colors">
                        {article.title}
                      </h4>
                      <p className="text-xs text-ink-muted line-clamp-1 mt-0.5 font-light">
                        {article.excerpt}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-ink-light group-hover:text-rfblue group-hover:translate-x-0.5 transition-all mt-2 shrink-0 ml-2" />
                </div>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-ink-muted">No matching research articles found.</p>
              <p className="text-xs text-ink-light mt-1">Try broader terms like "quantum", "silicon", or "physics".</p>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-ink-light">
              Type to search articles across all editorial categories.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
