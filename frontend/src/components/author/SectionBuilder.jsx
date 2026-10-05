import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  MoveUp,
  MoveDown,
  Copy,
  Trash2,
  Plus,
  AlignLeft,
  Heading as HeadingIcon,
  Table as TableIcon,
  Quote,
  AlertTriangle,
  Image as ImageIcon,
  Minus,
  HelpCircle,
  UploadCloud,
  Loader2,
  X,
  Layers,
  FileText,
  List as ListIcon
} from 'lucide-react';
import {
  blocksToSections,
  sectionsToBlocks,
  duplicateSection,
  getSectionMetrics
} from '../../utils/articleSections.js';
import { RichTextEditor } from '../article/RichTextEditor.jsx';
import { normalizeMediaUrl, mediaApi } from '../../services/media.api.js';

export function SectionBuilder({
  blocks = [],
  onChange,
  canUploadMedia = true,
  onAlert
}) {
  const [expandedSectionIds, setExpandedSectionIds] = useState(() => {
    // By default expand the first section
    const initialSections = blocksToSections(blocks);
    return new Set(initialSections.length > 0 ? [initialSections[0].id] : ['sec-intro']);
  });

  const [uploadingBlockId, setUploadingBlockId] = useState(null);

  const sections = useMemo(() => {
    return blocksToSections(blocks);
  }, [blocks]);

  const toggleExpand = (secId) => {
    setExpandedSectionIds(prev => {
      const next = new Set(prev);
      if (next.has(secId)) next.delete(secId);
      else next.add(secId);
      return next;
    });
  };

  const handleUpdateSections = (newSections) => {
    const flatBlocks = sectionsToBlocks(newSections);
    onChange(flatBlocks);
  };

  const handleSectionTitleChange = (secIndex, newTitle) => {
    const next = [...sections];
    next[secIndex] = {
      ...next[secIndex],
      title: newTitle
    };
    handleUpdateSections(next);
  };

  const handleMoveSection = (secIndex, direction) => {
    const targetIndex = secIndex + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const next = [...sections];
    const temp = next[secIndex];
    next[secIndex] = next[targetIndex];
    next[targetIndex] = temp;
    handleUpdateSections(next);
  };

  const handleDuplicateSection = (secIndex) => {
    const target = sections[secIndex];
    const cloned = duplicateSection(target);
    const next = [
      ...sections.slice(0, secIndex + 1),
      cloned,
      ...sections.slice(secIndex + 1)
    ];
    setExpandedSectionIds(prev => new Set([...prev, cloned.id]));
    handleUpdateSections(next);
    if (onAlert) {
      onAlert({ type: 'success', message: `Duplicated section: "${target.title}"` });
    }
  };

  const handleDeleteSection = (secIndex) => {
    if (sections.length <= 1) {
      if (onAlert) onAlert({ type: 'error', message: 'An article must have at least one section.' });
      return;
    }
    const targetTitle = sections[secIndex].title;
    const next = sections.filter((_, i) => i !== secIndex);
    handleUpdateSections(next);
    if (onAlert) {
      onAlert({ type: 'success', message: `Deleted section: "${targetTitle}"` });
    }
  };

  const handleAddSection = (afterIndex) => {
    const timestamp = Date.now();
    const newHeadingId = `block-${timestamp}-h`;
    const newHeadingBlock = {
      id: newHeadingId,
      blockType: 'heading',
      position: 0,
      content: { level: 2, text: 'New Chapter Section' }
    };
    const newBodyBlock = {
      id: `block-${timestamp}-p`,
      blockType: 'paragraph',
      position: 1,
      content: { text: '' }
    };

    const newSec = {
      id: `sec-${timestamp}`,
      title: 'New Chapter Section',
      headingBlockId: newHeadingId,
      blocks: [newHeadingBlock, newBodyBlock]
    };

    const insertIdx = afterIndex >= 0 ? afterIndex + 1 : sections.length;
    const next = [
      ...sections.slice(0, insertIdx),
      newSec,
      ...sections.slice(insertIdx)
    ];

    setExpandedSectionIds(prev => new Set([...prev, newSec.id]));
    handleUpdateSections(next);
  };

  // Block level operations within a section
  const handleUpdateBlockContent = (secIndex, blockIndex, newContent) => {
    const next = [...sections];
    const secBlocks = [...next[secIndex].blocks];
    secBlocks[blockIndex] = {
      ...secBlocks[blockIndex],
      content: { ...secBlocks[blockIndex].content, ...newContent }
    };
    next[secIndex] = { ...next[secIndex], blocks: secBlocks };
    handleUpdateSections(next);
  };

  const handleAddBlockToSection = (secIndex, type) => {
    let initialContent = {};
    if (type === 'heading') initialContent = { level: 3, text: 'Subsection Heading' };
    else if (type === 'paragraph') initialContent = { text: '' };
    else if (type === 'quote') initialContent = { quote: '', author: '', source: '' };
    else if (type === 'callout') initialContent = { variant: 'info', title: 'Key Finding', text: '' };
    else if (type === 'table' || type === 'comparison') {
      initialContent = {
        headers: ['Factor', 'Score / Metric'],
        rows: [{ label: 'Metric A', values: ['Value 1'] }]
      };
    } else if (type === 'image') {
      initialContent = { url: '', alt: 'Figure illustration', caption: '' };
    } else if (type === 'divider') {
      initialContent = {};
    } else if (type === 'faq') {
      initialContent = {
        items: [{ question: 'Question...', answer: 'Empirical answer...' }]
      };
    } else if (type === 'list') {
      initialContent = {
        ordered: false,
        items: ['First item...', 'Second item...']
      };
    }

    const newBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      blockType: type,
      position: nextPosition(secIndex),
      content: initialContent
    };

    const next = [...sections];
    next[secIndex] = {
      ...next[secIndex],
      blocks: [...(next[secIndex].blocks || []), newBlock]
    };
    handleUpdateSections(next);
  };

  const handleRemoveBlockFromSection = (secIndex, blockIndex) => {
    const next = [...sections];
    const sec = next[secIndex];
    const secBlocks = sec.blocks.filter((_, i) => i !== blockIndex);
    next[secIndex] = { ...sec, blocks: secBlocks };
    handleUpdateSections(next);
  };

  const handleMoveBlockInSection = (secIndex, blockIndex, direction) => {
    const next = [...sections];
    const sec = next[secIndex];
    const targetIdx = blockIndex + direction;
    if (targetIdx < 0 || targetIdx >= sec.blocks.length) return;

    const blocksCopy = [...sec.blocks];
    const temp = blocksCopy[blockIndex];
    blocksCopy[blockIndex] = blocksCopy[targetIdx];
    blocksCopy[targetIdx] = temp;

    next[secIndex] = { ...sec, blocks: blocksCopy };
    handleUpdateSections(next);
  };

  const handleBlockImageUpload = async (secIndex, blockIndex, file) => {
    if (!file) return;
    if (!canUploadMedia) {
      if (onAlert) onAlert({ type: 'error', message: 'Permission denied: Media upload not permitted.' });
      return;
    }

    const block = sections[secIndex]?.blocks?.[blockIndex];
    if (!block) return;

    setUploadingBlockId(block.id);
    try {
      const res = await mediaApi.upload(file, {
        altText: block.content?.alt || 'Manuscript figure'
      });
      const publicUrl = res.data?.publicUrl || res.publicUrl;
      if (!publicUrl) throw new Error('Failed to retrieve uploaded media URL.');

      handleUpdateBlockContent(secIndex, blockIndex, { url: normalizeMediaUrl(publicUrl) });
      if (onAlert) onAlert({ type: 'success', message: 'Figure image uploaded successfully.' });
    } catch (err) {
      if (onAlert) onAlert({ type: 'error', message: err.message || 'Image upload failed.' });
    } finally {
      setUploadingBlockId(null);
    }
  };

  const nextPosition = (secIndex) => {
    return (sections[secIndex]?.blocks || []).length;
  };

  return (
    <div className="space-y-6">
      {/* Top Section Summary & Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Section Outline Builder</span>
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Structure your article into chapters with dedicated H2 sections, drag-and-drop reordering, and in-place block editors.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleAddSection(sections.length - 1)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Section</span>
          </button>
        </div>
      </div>

      {/* Sections Accordion List */}
      <div className="space-y-4">
        {sections.map((section, secIndex) => {
          const isExpanded = expandedSectionIds.has(section.id);
          const metrics = getSectionMetrics(section);
          const isIntro = secIndex === 0 && !section.headingBlockId;

          return (
            <div
              key={section.id}
              className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs overflow-hidden transition-all"
            >
              {/* Section Header Card */}
              <div
                className={`p-4 sm:p-5 flex items-start justify-between gap-3 border-b transition-colors ${
                  isExpanded
                    ? 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60'
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* Left: Expand Toggle & Editable Title */}
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleExpand(section.id)}
                    className="mt-1 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title={isExpanded ? 'Collapse Section' : 'Expand Section'}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        {isIntro ? 'Introduction' : `Section ${secIndex + 1}`}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {metrics.totalBlocks} {metrics.totalBlocks === 1 ? 'block' : 'blocks'} (~{metrics.wordCount} words)
                      </span>
                    </div>

                    {isIntro ? (
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {section.title || 'Introduction'}
                      </h4>
                    ) : (
                      <input
                        type="text"
                        value={section.title || ''}
                        onChange={(e) => handleSectionTitleChange(secIndex, e.target.value)}
                        placeholder="Section Title (H2 Heading)..."
                        className="w-full text-base font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none border-b border-transparent focus:border-blue-500 pb-0.5 placeholder-slate-400 dark:placeholder-slate-500"
                      />
                    )}

                    {!isExpanded && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1 max-w-xl">
                        {metrics.previewText}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Section Actions */}
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveSection(secIndex, -1)}
                    disabled={secIndex === 0}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-25 transition-colors cursor-pointer"
                    title="Move Section Up"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveSection(secIndex, 1)}
                    disabled={secIndex === sections.length - 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-25 transition-colors cursor-pointer"
                    title="Move Section Down"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicateSection(secIndex)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    title="Duplicate Section"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSection(secIndex)}
                    disabled={sections.length <= 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 disabled:opacity-25 transition-colors cursor-pointer"
                    title="Delete Section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Section Body (When Expanded) */}
              {isExpanded && (
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Blocks inside this Section */}
                  <div className="space-y-4">
                    {section.blocks.map((block, blockIndex) => {
                      const isSectionHeading = block.id === section.headingBlockId || (block.blockType === 'heading' && blockIndex === 0 && !isIntro);

                      return (
                        <div
                          key={block.id || blockIndex}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3"
                        >
                          {/* Block Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-blue-600 dark:text-blue-400">
                              {block.blockType} {isSectionHeading ? '(Chapter Heading)' : ''}
                            </span>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleMoveBlockInSection(secIndex, blockIndex, -1)}
                                disabled={blockIndex === 0}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-25 transition-colors"
                                title="Move Block Up"
                              >
                                <MoveUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveBlockInSection(secIndex, blockIndex, 1)}
                                disabled={blockIndex === section.blocks.length - 1}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-25 transition-colors"
                                title="Move Block Down"
                              >
                                <MoveDown className="w-3.5 h-3.5" />
                              </button>
                              {!isSectionHeading && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBlockFromSection(secIndex, blockIndex)}
                                  className="p-1 text-slate-400 hover:text-red-500 transition-colors ml-1"
                                  title="Delete Block"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Block Contents */}
                          {block.blockType === 'heading' && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Level:</span>
                                {[2, 3].map(lvl => (
                                  <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => handleUpdateBlockContent(secIndex, blockIndex, { level: lvl })}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                      (block.content?.level || 2) === lvl
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}
                                  >
                                    H{lvl}
                                  </button>
                                ))}
                              </div>
                              <input
                                type="text"
                                value={block.content?.text || ''}
                                onChange={(e) => handleUpdateBlockContent(secIndex, blockIndex, { text: e.target.value })}
                                placeholder="Heading text..."
                                className="w-full text-lg font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none border-b border-slate-200 dark:border-slate-800 focus:border-blue-500 pb-1"
                              />
                            </div>
                          )}

                          {block.blockType === 'paragraph' && (
                            <RichTextEditor
                              content={block.content}
                              onChange={(updated) => handleUpdateBlockContent(secIndex, blockIndex, updated)}
                              placeholder="Write research text for this chapter..."
                            />
                          )}

                          {block.blockType === 'quote' && (
                            <div className="space-y-2 pl-3 border-l-4 border-blue-500">
                              <textarea
                                value={block.content?.quote ?? block.content?.text ?? ''}
                                onChange={(e) => handleUpdateBlockContent(secIndex, blockIndex, {
                                  quote: e.target.value,
                                  text: e.target.value
                                })}
                                placeholder="Pull quote or empirical statement..."
                                rows={2}
                                className="w-full text-sm italic text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none resize-none"
                              />
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={block.content?.author ?? ''}
                                  onChange={(e) => handleUpdateBlockContent(secIndex, blockIndex, { author: e.target.value })}
                                  placeholder="Attribution / Author"
                                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                                />
                                <input
                                  type="text"
                                  value={block.content?.source ?? ''}
                                  onChange={(e) => handleUpdateBlockContent(secIndex, blockIndex, { source: e.target.value })}
                                  placeholder="Source publication"
                                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                                />
                              </div>
                            </div>
                          )}

                          {block.blockType === 'callout' && (
                            <div
                              className={`p-3 rounded-lg border space-y-2 ${
                                block.content?.variant === 'warning'
                                  ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                                  : block.content?.variant === 'tip'
                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                                  : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                {['info', 'warning', 'tip'].map(v => (
                                  <button
                                    key={v}
                                    type="button"
                                    onClick={() => handleUpdateBlockContent(secIndex, blockIndex, { variant: v, type: v })}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                                      (block.content?.variant || 'info') === v
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}
                                  >
                                    {v}
                                  </button>
                                ))}
                              </div>
                              <input
                                type="text"
                                value={block.content?.title || ''}
                                onChange={(e) => handleUpdateBlockContent(secIndex, blockIndex, { title: e.target.value })}
                                placeholder="Callout Title..."
                                className="w-full text-xs font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none border-b border-slate-200 dark:border-slate-800 pb-0.5"
                              />
                              <textarea
                                value={block.content?.text ?? ''}
                                onChange={(e) => handleUpdateBlockContent(secIndex, blockIndex, { text: e.target.value })}
                                placeholder="Callout observation or finding..."
                                rows={2}
                                className="w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none resize-none"
                              />
                            </div>
                          )}

                          {(block.blockType === 'table' || block.blockType === 'comparison') && (() => {
                            const headers = Array.isArray(block.content?.headers) ? block.content.headers : ['Column 1', 'Column 2'];
                            const rawRows = Array.isArray(block.content?.rows) ? block.content.rows : [];
                            const rows = rawRows.map(r => {
                              if (Array.isArray(r)) return { label: r[0] || '', values: r.slice(1) };
                              return { label: r?.label || '', values: Array.isArray(r?.values) ? r.values : [] };
                            });

                            return (
                              <div className="space-y-2 overflow-x-auto">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">Table Matrix</span>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newHeaders = [...headers, `Col ${headers.length + 1}`];
                                        const newRows = rows.map(r => ({ ...r, values: [...r.values, ''] }));
                                        handleUpdateBlockContent(secIndex, blockIndex, { headers: newHeaders, rows: newRows });
                                      }}
                                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                      + Col
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newRows = [...rows, { label: `Item ${rows.length + 1}`, values: new Array(Math.max(1, headers.length - 1)).fill('') }];
                                        handleUpdateBlockContent(secIndex, blockIndex, { rows: newRows });
                                      }}
                                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                      + Row
                                    </button>
                                  </div>
                                </div>
                                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                                  <table className="w-full text-xs">
                                    <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                      <tr>
                                        {headers.map((h, hIdx) => (
                                          <th key={hIdx} className="p-1.5">
                                            <input
                                              type="text"
                                              value={h}
                                              onChange={(e) => {
                                                const next = [...headers];
                                                next[hIdx] = e.target.value;
                                                handleUpdateBlockContent(secIndex, blockIndex, { headers: next });
                                              }}
                                              className="w-full text-xs font-bold px-1 py-0.5 bg-white dark:bg-slate-950 rounded border border-slate-300 dark:border-slate-700"
                                            />
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                      {rows.map((r, rIdx) => (
                                        <tr key={rIdx}>
                                          <td className="p-1.5">
                                            <input
                                              type="text"
                                              value={r.label}
                                              onChange={(e) => {
                                                const nextRows = [...rows];
                                                nextRows[rIdx] = { ...nextRows[rIdx], label: e.target.value };
                                                handleUpdateBlockContent(secIndex, blockIndex, { rows: nextRows });
                                              }}
                                              className="w-full text-xs font-semibold px-1 py-0.5 bg-white dark:bg-slate-950 rounded border border-slate-300 dark:border-slate-700"
                                            />
                                          </td>
                                          {headers.slice(1).map((_, vIdx) => (
                                            <td key={vIdx} className="p-1.5">
                                              <input
                                                type="text"
                                                value={r.values[vIdx] || ''}
                                                onChange={(e) => {
                                                  const nextRows = [...rows];
                                                  const nextVals = [...(nextRows[rIdx].values || [])];
                                                  nextVals[vIdx] = e.target.value;
                                                  nextRows[rIdx] = { ...nextRows[rIdx], values: nextVals };
                                                  handleUpdateBlockContent(secIndex, blockIndex, { rows: nextRows });
                                                }}
                                                className="w-full text-xs px-1 py-0.5 bg-white dark:bg-slate-950 rounded border border-slate-300 dark:border-slate-700"
                                              />
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })()}

                          {block.blockType === 'image' && (
                            <div className="space-y-2">
                              {block.content?.url ? (
                                <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                                  <img
                                    src={normalizeMediaUrl(block.content.url)}
                                    alt={block.content.alt || 'Figure'}
                                    className="w-full max-h-48 object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateBlockContent(secIndex, blockIndex, { url: '' })}
                                    className="absolute top-2 right-2 p-1 bg-black/70 text-white rounded-full"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <label className="flex items-center space-x-2 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer text-xs text-slate-700 dark:text-slate-300 hover:border-blue-500">
                                    {uploadingBlockId === block.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                    ) : (
                                      <UploadCloud className="w-4 h-4 text-blue-500" />
                                    )}
                                    <span>Upload Image File</span>
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp"
                                      onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) handleBlockImageUpload(secIndex, blockIndex, f);
                                        e.target.value = '';
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                  <input
                                    type="url"
                                    value={block.content?.url || ''}
                                    onChange={(e) => handleUpdateBlockContent(secIndex, blockIndex, { url: e.target.value })}
                                    placeholder="Or paste direct image URL..."
                                    className="flex-1 text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                                  />
                                </div>
                              )}
                              <input
                                type="text"
                                value={block.content?.caption || ''}
                                onChange={(e) => handleUpdateBlockContent(secIndex, blockIndex, { caption: e.target.value })}
                                placeholder="Figure caption..."
                                className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                              />
                            </div>
                          )}

                          {block.blockType === 'divider' && (
                            <div className="py-2 text-center">
                              <hr className="border-t border-slate-200 dark:border-slate-800" />
                            </div>
                          )}

                          {block.blockType === 'faq' && (() => {
                            const items = Array.isArray(block.content?.items) ? block.content.items : [];
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">FAQ Questions</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleUpdateBlockContent(secIndex, blockIndex, {
                                        items: [...items, { question: '', answer: '' }]
                                      });
                                    }}
                                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    + Add Question
                                  </button>
                                </div>
                                {items.map((item, itemIdx) => (
                                  <div key={itemIdx} className="p-2 rounded border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                                    <input
                                      type="text"
                                      value={item.question || ''}
                                      onChange={(e) => {
                                        const nextItems = items.map((it, i) => i === itemIdx ? { ...it, question: e.target.value } : it);
                                        handleUpdateBlockContent(secIndex, blockIndex, { items: nextItems });
                                      }}
                                      placeholder="Question..."
                                      className="w-full text-xs font-semibold p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                                    />
                                    <textarea
                                      value={item.answer || ''}
                                      onChange={(e) => {
                                        const nextItems = items.map((it, i) => i === itemIdx ? { ...it, answer: e.target.value } : it);
                                        handleUpdateBlockContent(secIndex, blockIndex, { items: nextItems });
                                      }}
                                      placeholder="Answer..."
                                      rows={2}
                                      className="w-full text-xs p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                                    />
                                  </div>
                                ))}
                              </div>
                            );
                          })()}

                          {/* 9. LIST BLOCK */}
                          {block.blockType === 'list' && (() => {
                            const rawItems = Array.isArray(block.content?.items) ? block.content.items : [];
                            const items = rawItems.map(it => typeof it === 'string' ? it : it?.text || '');
                            const ordered = Boolean(block.content?.ordered);

                            const updateList = (newItems, newOrdered = ordered) => {
                              handleUpdateBlockContent(secIndex, blockIndex, {
                                items: newItems,
                                ordered: newOrdered
                              });
                            };

                            const handleItemChange = (itemIdx, val) => {
                              const next = [...items];
                              next[itemIdx] = val;
                              updateList(next);
                            };

                            const handleAddItem = () => {
                              updateList([...items, '']);
                            };

                            const handleRemoveItem = (itemIdx) => {
                              updateList(items.filter((_, i) => i !== itemIdx));
                            };

                            const handleMoveItem = (itemIdx, dir) => {
                              const targetIdx = itemIdx + dir;
                              if (targetIdx < 0 || targetIdx >= items.length) return;
                              const next = [...items];
                              const temp = next[itemIdx];
                              next[itemIdx] = next[targetIdx];
                              next[targetIdx] = temp;
                              updateList(next);
                            };

                            return (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">List Type:</span>
                                    <button
                                      type="button"
                                      onClick={() => updateList(items, false)}
                                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                                        !ordered
                                          ? 'bg-blue-600 text-white shadow-2xs'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                      }`}
                                    >
                                      Bullet List (•)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateList(items, true)}
                                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                                        ordered
                                          ? 'bg-blue-600 text-white shadow-2xs'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                      }`}
                                    >
                                      Numbered List (1, 2, 3)
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Item</span>
                                  </button>
                                </div>

                                {items.length === 0 ? (
                                  <div className="p-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/30">
                                    <p className="text-xs text-slate-500 mb-2">No items in this list.</p>
                                    <button
                                      type="button"
                                      onClick={handleAddItem}
                                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                    >
                                      + Add First Item
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {items.map((item, itemIdx) => (
                                      <div key={itemIdx} className="flex items-start space-x-2">
                                        <span className="text-xs font-bold text-slate-400 mt-2 min-w-[20px] text-right shrink-0">
                                          {ordered ? `${itemIdx + 1}.` : '•'}
                                        </span>
                                        <textarea
                                          value={item}
                                          onChange={(e) => handleItemChange(itemIdx, e.target.value)}
                                          placeholder={`List item ${itemIdx + 1}...`}
                                          rows={2}
                                          className="flex-1 text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 resize-y leading-relaxed"
                                        />
                                        <div className="flex flex-col space-y-1 mt-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => handleMoveItem(itemIdx, -1)}
                                            disabled={itemIdx === 0}
                                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-25 transition-colors cursor-pointer"
                                            title="Move Item Up"
                                          >
                                            <MoveUp className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleMoveItem(itemIdx, 1)}
                                            disabled={itemIdx === items.length - 1}
                                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-25 transition-colors cursor-pointer"
                                            title="Move Item Down"
                                          >
                                            <MoveDown className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveItem(itemIdx)}
                                            className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                            title="Delete Item"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Block to this specific Section */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                      Add Block to {section.title || 'this section'}
                    </span>
                    <div className="flex items-center justify-center flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddBlockToSection(secIndex, 'paragraph')}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600"
                      >
                        <AlignLeft className="w-3 h-3 text-blue-500" />
                        <span>Paragraph</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlockToSection(secIndex, 'heading')}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600"
                      >
                        <HeadingIcon className="w-3 h-3 text-blue-500" />
                        <span>Subsection H3</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlockToSection(secIndex, 'list')}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600"
                      >
                        <ListIcon className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                        <span>List</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlockToSection(secIndex, 'table')}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600"
                      >
                        <TableIcon className="w-3 h-3 text-emerald-500" />
                        <span>Table Matrix</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlockToSection(secIndex, 'quote')}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600"
                      >
                        <Quote className="w-3 h-3 text-teal-500" />
                        <span>Quote</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlockToSection(secIndex, 'callout')}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span>Callout</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlockToSection(secIndex, 'image')}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600"
                      >
                        <ImageIcon className="w-3 h-3 text-purple-500" />
                        <span>Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlockToSection(secIndex, 'divider')}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600"
                      >
                        <Minus className="w-3 h-3 text-slate-400" />
                        <span>Divider</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlockToSection(secIndex, 'faq')}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600"
                      >
                        <HelpCircle className="w-3 h-3 text-indigo-500" />
                        <span>FAQ</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
