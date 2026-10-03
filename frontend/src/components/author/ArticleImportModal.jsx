import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  FileText,
  Table as TableIcon,
  Heading,
  List,
  Quote,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { parseImportContent, inspectImportContent } from '../../utils/articleImportParser.js';

export function ArticleImportModal({
  isOpen,
  onClose,
  onImport
}) {
  const [inputText, setInputText] = useState('');
  const [importMode, setImportMode] = useState('append'); // 'append' | 'replace'
  const [activePreview, setActivePreview] = useState(false);

  const counts = useMemo(() => {
    return inspectImportContent(inputText);
  }, [inputText]);

  const parsedBlocks = useMemo(() => {
    if (!activePreview || !inputText.trim()) return [];
    return parseImportContent(inputText);
  }, [activePreview, inputText]);

  if (!isOpen) return null;

  const handleConfirmImport = () => {
    const blocks = parseImportContent(inputText);
    if (blocks.length === 0) return;
    onImport({ blocks, mode: importMode });
    setInputText('');
    setActivePreview(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Import Article Content
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paste Markdown, ChatGPT, Claude, Word, or Google Docs output to convert into structured blocks.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Import Mode:</span>
              <button
                type="button"
                onClick={() => setImportMode('append')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  importMode === 'append'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Append to Existing Blocks
              </button>
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  importMode === 'replace'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Replace All Blocks
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActivePreview(!activePreview)}
              disabled={!inputText.trim()}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-40"
            >
              {activePreview ? '← Back to Raw Text' : 'Live Block Preview →'}
            </button>
          </div>

          {/* Input Textarea or Live Preview */}
          {!activePreview ? (
            <div className="space-y-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste manuscript text, Markdown headers (# / ##), tables (| Col |), blockquotes (>), or callouts (> [!NOTE])..."
                rows={12}
                className="w-full text-xs font-mono p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y leading-relaxed placeholder-slate-400 dark:placeholder-slate-600"
              />
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-950/60 max-h-96 overflow-y-auto space-y-3">
              {parsedBlocks.map((block, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Block {idx + 1}: {block.blockType}</span>
                    {block.content?.level && <span>Level {block.content.level}</span>}
                  </div>
                  {block.blockType === 'heading' && (
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{block.content?.text}</p>
                  )}
                  {block.blockType === 'paragraph' && (
                    <p className="line-clamp-2 text-slate-600 dark:text-slate-300">{block.content?.text}</p>
                  )}
                  {block.blockType === 'table' && (
                    <p className="italic text-slate-500">
                      Table with {block.content?.headers?.length || 0} headers and {block.content?.rows?.length || 0} rows.
                    </p>
                  )}
                  {block.blockType === 'quote' && (
                    <p className="italic border-l-2 border-blue-500 pl-2 text-slate-600 dark:text-slate-300">
                      "{block.content?.quote || block.content?.text}"
                    </p>
                  )}
                  {block.blockType === 'callout' && (
                    <p className="font-semibold text-amber-600 dark:text-amber-400">
                      [{block.content?.variant?.toUpperCase()}] {block.content?.title}: {block.content?.text}
                    </p>
                  )}
                  {block.blockType === 'list' && (
                    <p className="text-slate-600 dark:text-slate-300">
                      List ({block.content?.items?.length || 0} items)
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Detected Elements Metric Badges */}
          <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Detected Content Elements ({counts.totalBlocks} total blocks):
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <Heading className="w-3.5 h-3.5 text-blue-500" />
                <span>{counts.headings} Headings</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>{counts.paragraphs} Paragraphs</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <TableIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>{counts.tables} Tables</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <List className="w-3.5 h-3.5 text-purple-500" />
                <span>{counts.lists} Lists</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>{counts.callouts} Callouts</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <Quote className="w-3.5 h-3.5 text-teal-500" />
                <span>{counts.quotes} Quotes</span>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {importMode === 'replace' ? '⚠️ This will replace all existing blocks in the article.' : 'New blocks will be inserted at the end of the manuscript.'}
          </p>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={counts.totalBlocks === 0}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Import {counts.totalBlocks} Blocks</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
