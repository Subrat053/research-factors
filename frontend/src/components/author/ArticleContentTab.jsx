import React, { useState } from 'react';
import {
  Layers,
  FileText,
  Sparkles,
  ArrowUpDown,
  BookOpen
} from 'lucide-react';
import { SectionBuilder } from './SectionBuilder.jsx';
import { FullArticleEditor } from './FullArticleEditor.jsx';
import { ArticleImportModal } from './ArticleImportModal.jsx';

export function ArticleContentTab({
  blocks = [],
  onChange,
  canUploadMedia = true,
  onAlert
}) {
  const [editingMode, setEditingMode] = useState('sections'); // 'sections' | 'full'
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleBlocksChange = (updatedBlocks) => {
    onChange('blocks', updatedBlocks);
  };

  const handleImport = ({ blocks: importedBlocks, mode }) => {
    let newBlocks;
    if (mode === 'replace') {
      newBlocks = importedBlocks.map((b, idx) => ({ ...b, position: idx }));
    } else {
      const baseLength = blocks.length;
      const reindexedImported = importedBlocks.map((b, idx) => ({
        ...b,
        position: baseLength + idx
      }));
      newBlocks = [...blocks, ...reindexedImported];
    }

    handleBlocksChange(newBlocks);
    if (onAlert) {
      onAlert({
        type: 'success',
        message: `Successfully imported ${importedBlocks.length} content blocks!`
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher & Import Header */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mode Toggle */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">
            Editor View:
          </span>
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setEditingMode('sections')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                editingMode === 'sections'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Section Builder</span>
            </button>
            <button
              type="button"
              onClick={() => setEditingMode('full')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                editingMode === 'full'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Article View</span>
            </button>
          </div>
        </div>

        {/* Right: Paste / Import from External AI / Markdown */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            title="Import Markdown, ChatGPT, Claude, Word, or Google Docs"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Paste / Import Article</span>
          </button>
        </div>
      </div>

      {/* Mode Renderers */}
      {editingMode === 'sections' ? (
        <SectionBuilder
          blocks={blocks}
          onChange={handleBlocksChange}
          canUploadMedia={canUploadMedia}
          onAlert={onAlert}
        />
      ) : (
        <FullArticleEditor
          blocks={blocks}
          onChange={handleBlocksChange}
          canUploadMedia={canUploadMedia}
          onAlert={onAlert}
        />
      )}

      {/* Paste / Import Modal */}
      <ArticleImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
}
