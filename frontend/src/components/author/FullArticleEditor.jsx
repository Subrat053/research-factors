import React, { useState } from 'react';
import {
  MoveUp,
  MoveDown,
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
  List as ListIcon
} from 'lucide-react';
import { RichTextEditor } from '../article/RichTextEditor.jsx';
import { normalizeMediaUrl, mediaApi } from '../../services/media.api.js';

export function FullArticleEditor({
  blocks = [],
  onChange,
  canUploadMedia = true,
  onAlert
}) {
  const [uploadingBlockIndex, setUploadingBlockIndex] = useState(null);

  const handleBlockContentChange = (index, newContent) => {
    const newBlocks = [...blocks];
    newBlocks[index] = {
      ...newBlocks[index],
      content: { ...newBlocks[index].content, ...newContent }
    };
    onChange(newBlocks);
  };

  const addBlock = (type, atIndex = null) => {
    let initialContent = {};
    if (type === 'heading') {
      initialContent = { level: 2, text: 'New Section Heading' };
    } else if (type === 'paragraph') {
      initialContent = { text: '' };
    } else if (type === 'quote') {
      initialContent = {
        quote: '',
        author: '',
        source: ''
      };
    } else if (type === 'callout') {
      initialContent = {
        variant: 'info',
        title: 'Key Takeaway',
        text: ''
      };
    } else if (type === 'table' || type === 'comparison') {
      initialContent = {
        headers: ['Factor', 'Methodology', 'Benchmark Score'],
        rows: [
          { label: 'Metric A', values: ['Test 1', '98.4'] }
        ]
      };
    } else if (type === 'image') {
      initialContent = {
        url: '',
        alt: 'Figure illustration',
        caption: ''
      };
    } else if (type === 'divider') {
      initialContent = {};
    } else if (type === 'faq') {
      initialContent = {
        items: [
          {
            question: '',
            answer: ''
          }
        ]
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
      position: atIndex !== null ? atIndex : blocks.length,
      content: initialContent
    };

    let updatedBlocks;
    if (atIndex !== null) {
      updatedBlocks = [
        ...blocks.slice(0, atIndex),
        newBlock,
        ...blocks.slice(atIndex)
      ].map((b, idx) => ({ ...b, position: idx }));
    } else {
      updatedBlocks = [...blocks, newBlock].map((b, idx) => ({ ...b, position: idx }));
    }

    onChange(updatedBlocks);
  };

  const removeBlock = (index) => {
    if (blocks.length <= 1) {
      if (onAlert) onAlert({ type: 'error', message: 'Article must contain at least one content block.' });
      return;
    }
    const newBlocks = blocks
      .filter((_, i) => i !== index)
      .map((b, i) => ({ ...b, position: i }));
    onChange(newBlocks);
  };

  const moveBlock = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    const reindexed = newBlocks.map((b, i) => ({ ...b, position: i }));
    onChange(reindexed);
  };

  const handleBlockImageUpload = async (index, file) => {
    if (!file) return;
    if (!canUploadMedia) {
      if (onAlert) onAlert({ type: 'error', message: 'Permission denied: Media upload not permitted.' });
      return;
    }

    setUploadingBlockIndex(index);
    try {
      const res = await mediaApi.upload(file, {
        altText: blocks[index]?.content?.alt || 'Figure Image'
      });
      const publicUrl = res.data?.publicUrl || res.publicUrl;
      if (!publicUrl) throw new Error('Failed to obtain uploaded asset URL.');

      handleBlockContentChange(index, { url: normalizeMediaUrl(publicUrl) });
      if (onAlert) onAlert({ type: 'success', message: 'Figure image uploaded successfully!' });
    } catch (err) {
      if (onAlert) onAlert({ type: 'error', message: err.message || 'Image upload failed.' });
    } finally {
      setUploadingBlockIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Blocks Stream */}
      {blocks.map((block, index) => (
        <div key={block.id || index} className="space-y-2">
          {/* Card for Block */}
          <div className="group bg-white dark:bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            {/* Block Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 text-[10px]">
                  Block {index + 1}: {block.blockType}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => moveBlock(index, -1)}
                  disabled={index === 0}
                  className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                  title="Move Up"
                >
                  <MoveUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(index, 1)}
                  disabled={index === blocks.length - 1}
                  className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                  title="Move Down"
                >
                  <MoveDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(index)}
                  className="p-1 text-slate-400 hover:text-red-500 ml-2 transition-colors cursor-pointer"
                  title="Delete Block"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Block Content Renderers */}
            {/* 1. HEADING */}
            {block.blockType === 'heading' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Level:</span>
                  {[2, 3].map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleBlockContentChange(index, { level: lvl })}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                        (block.content?.level || 2) === lvl
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      H{lvl} Section
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={block.content?.text || ''}
                  onChange={(e) => handleBlockContentChange(index, { text: e.target.value })}
                  placeholder="Section Heading Title..."
                  className="w-full text-xl font-semibold text-slate-900 dark:text-white focus:outline-none border-b border-slate-200 dark:border-slate-800 focus:border-blue-500 pb-1 bg-transparent placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            )}

            {/* 2. PARAGRAPH */}
            {block.blockType === 'paragraph' && (
              <RichTextEditor
                content={block.content}
                onChange={(updated) => handleBlockContentChange(index, updated)}
                placeholder="Write manuscript findings, empirical prose, or methodology..."
              />
            )}

            {/* 3. PULL QUOTE */}
            {block.blockType === 'quote' && (
              <div className="space-y-3 pl-4 border-l-4 border-blue-600 dark:border-blue-500">
                <textarea
                  value={block.content?.quote ?? block.content?.text ?? ''}
                  onChange={(e) => handleBlockContentChange(index, {
                    quote: e.target.value,
                    text: e.target.value
                  })}
                  placeholder="Key quote or thesis statement..."
                  rows={2}
                  className="w-full text-base italic text-slate-900 dark:text-white focus:outline-none resize-none bg-transparent placeholder-slate-400 dark:placeholder-slate-500"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={block.content?.author ?? block.content?.citation ?? ''}
                    onChange={(e) => handleBlockContentChange(index, {
                      author: e.target.value,
                      citation: e.target.value
                    })}
                    placeholder="Attribution (e.g. Dr. Eleanor Vance)"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={block.content?.source || ''}
                    onChange={(e) => handleBlockContentChange(index, { source: e.target.value })}
                    placeholder="Source / Citation (e.g. Nature 2026)"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* 4. CALLOUT */}
            {block.blockType === 'callout' && (
              <div
                className={`space-y-3 p-4 rounded-xl border ${
                  block.content?.variant === 'warning'
                    ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                    : block.content?.variant === 'tip'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                    : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Callout Type:</span>
                  {['info', 'warning', 'tip'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleBlockContentChange(index, { variant: v, type: v })}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold capitalize transition-colors cursor-pointer ${
                        (block.content?.variant || 'info') === v
                          ? 'bg-blue-600 text-white shadow-2xs'
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
                  onChange={(e) => handleBlockContentChange(index, { title: e.target.value })}
                  placeholder="Callout Header / Title..."
                  className="w-full text-xs font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none border-b border-slate-300 dark:border-slate-800 focus:border-blue-500 pb-1"
                />

                <textarea
                  value={block.content?.text ?? block.content?.message ?? ''}
                  onChange={(e) => handleBlockContentChange(index, {
                    text: e.target.value,
                    message: e.target.value
                  })}
                  placeholder="Callout body text or contextual observation..."
                  rows={2}
                  className="w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none resize-none"
                />
              </div>
            )}

            {/* 5. TABLE MATRIX */}
            {(block.blockType === 'table' || block.blockType === 'comparison') && (() => {
              const headers = Array.isArray(block.content?.headers) ? block.content.headers : ['Column 1', 'Column 2'];
              const rawRows = Array.isArray(block.content?.rows) ? block.content.rows : [];
              const rows = rawRows.map(r => {
                if (Array.isArray(r)) return { label: r[0] || '', values: r.slice(1) };
                return { label: r?.label || '', values: Array.isArray(r?.values) ? r.values : [] };
              });

              return (
                <div className="space-y-3 overflow-x-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Table Matrix Editor
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newHeaders = [...headers, `Col ${headers.length + 1}`];
                          const newRows = rows.map(r => ({ ...r, values: [...r.values, ''] }));
                          handleBlockContentChange(index, { headers: newHeaders, rows: newRows });
                        }}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Column</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newRows = [...rows, { label: `Factor ${rows.length + 1}`, values: new Array(Math.max(1, headers.length - 1)).fill('') }];
                          handleBlockContentChange(index, { rows: newRows });
                        }}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Row</span>
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950/40">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          {headers.map((h, hIdx) => (
                            <th key={hIdx} className="p-2 min-w-[120px]">
                              <div className="flex items-center space-x-1">
                                <input
                                  type="text"
                                  value={h}
                                  onChange={(e) => {
                                    const next = [...headers];
                                    next[hIdx] = e.target.value;
                                    handleBlockContentChange(index, { headers: next });
                                  }}
                                  placeholder={`Header ${hIdx + 1}`}
                                  className="w-full text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-blue-500"
                                />
                                {headers.length > 2 && hIdx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextHeaders = headers.filter((_, i) => i !== hIdx);
                                      const nextRows = rows.map(r => ({
                                        ...r,
                                        values: r.values.filter((_, i) => i !== hIdx - 1)
                                      }));
                                      handleBlockContentChange(index, { headers: nextHeaders, rows: nextRows });
                                    }}
                                    className="text-slate-400 hover:text-red-500 p-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </th>
                          ))}
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                        {rows.map((r, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/30">
                            <td className="p-2">
                              <input
                                type="text"
                                value={r.label}
                                onChange={(e) => {
                                  const nextRows = [...rows];
                                  nextRows[rIdx] = { ...nextRows[rIdx], label: e.target.value };
                                  handleBlockContentChange(index, { rows: nextRows });
                                }}
                                placeholder="Row Label..."
                                className="w-full text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-blue-500"
                              />
                            </td>
                            {headers.slice(1).map((_, vIdx) => (
                              <td key={vIdx} className="p-2">
                                <input
                                  type="text"
                                  value={r.values[vIdx] || ''}
                                  onChange={(e) => {
                                    const nextRows = [...rows];
                                    const nextValues = [...(nextRows[rIdx].values || [])];
                                    nextValues[vIdx] = e.target.value;
                                    nextRows[rIdx] = { ...nextRows[rIdx], values: nextValues };
                                    handleBlockContentChange(index, { rows: nextRows });
                                  }}
                                  placeholder="Value..."
                                  className="w-full text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-blue-500"
                                />
                              </td>
                            ))}
                            <td className="p-2 text-right">
                              {rows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextRows = rows.filter((_, i) => i !== rIdx);
                                    handleBlockContentChange(index, { rows: nextRows });
                                  }}
                                  className="text-slate-400 hover:text-red-500 p-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* 6. IMAGE FIGURE */}
            {block.blockType === 'image' && (
              <div className="space-y-3">
                {block.content?.url ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950">
                    <img
                      src={normalizeMediaUrl(block.content.url)}
                      alt={block.content.alt || 'Asset'}
                      className="w-full max-h-64 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleBlockContentChange(index, { url: '' })}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors shadow-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all text-center">
                      {uploadingBlockIndex === index ? (
                        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs font-semibold">Processing via Sharp WebP...</span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-1.5" />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Upload Figure Image</span>
                          <span className="text-[10px] text-slate-500">JPG, PNG, WebP up to 8MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleBlockImageUpload(index, f);
                          e.target.value = '';
                        }}
                        disabled={uploadingBlockIndex === index}
                        className="hidden"
                      />
                    </label>

                    <div className="flex flex-col justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Or Enter Direct Image URL</span>
                      <input
                        type="url"
                        value={block.content?.url || ''}
                        onChange={(e) => handleBlockContentChange(index, { url: e.target.value })}
                        placeholder="https://..."
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <input
                    type="text"
                    value={block.content?.caption || ''}
                    onChange={(e) => handleBlockContentChange(index, { caption: e.target.value })}
                    placeholder="Image Caption (e.g. Figure 1: Benchmark distribution)"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={block.content?.alt || ''}
                    onChange={(e) => handleBlockContentChange(index, { alt: e.target.value })}
                    placeholder="Alt description for screen readers"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* 7. DIVIDER */}
            {block.blockType === 'divider' && (
              <div className="py-4 text-center">
                <hr className="border-t border-slate-200 dark:border-slate-800 max-w-sm mx-auto" />
                <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 block">
                  Editorial Section Divider
                </span>
              </div>
            )}

            {/* 8. FAQ ACCORDION */}
            {block.blockType === 'faq' && (() => {
              const items = Array.isArray(block.content?.items) ? block.content.items : [];

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      FAQ Accordion ({items.length} Questions)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleBlockContentChange(index, {
                          items: [...items, { question: '', answer: '' }]
                        });
                      }}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      + Add Question
                    </button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, itemIdx) => (
                      <div key={itemIdx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">Q{itemIdx + 1}</span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                handleBlockContentChange(index, {
                                  items: items.filter((_, i) => i !== itemIdx)
                                });
                              }}
                              className="text-slate-400 hover:text-red-500 p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={item.question || ''}
                          onChange={(e) => {
                            const next = items.map((it, i) => i === itemIdx ? { ...it, question: e.target.value } : it);
                            handleBlockContentChange(index, { items: next });
                          }}
                          placeholder="Question..."
                          className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                        />
                        <textarea
                          value={item.answer || ''}
                          onChange={(e) => {
                            const next = items.map((it, i) => i === itemIdx ? { ...it, answer: e.target.value } : it);
                            handleBlockContentChange(index, { items: next });
                          }}
                          placeholder="Detailed answer..."
                          rows={2}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-y"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 9. LIST BLOCK */}
            {block.blockType === 'list' && (() => {
              const rawItems = Array.isArray(block.content?.items) ? block.content.items : [];
              const items = rawItems.map(it => typeof it === 'string' ? it : it?.text || '');
              const ordered = Boolean(block.content?.ordered);

              const updateList = (newItems, newOrdered = ordered) => {
                handleBlockContentChange(index, {
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
        </div>
      ))}

      {/* Bottom Block Inserter Bar */}
      <div className="p-6 bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center transition-colors">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-3">
          Insert Content Block
        </span>
        <div className="flex items-center justify-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addBlock('paragraph')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-750 hover:border-blue-500 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
          >
            <AlignLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Paragraph</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('heading')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-750 hover:border-blue-500 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
          >
            <HeadingIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Heading</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('list')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-750 hover:border-blue-500 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
          >
            <ListIcon className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>List</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('comparison')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-750 hover:border-blue-500 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
          >
            <TableIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Table Matrix</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('quote')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-750 hover:border-blue-500 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
          >
            <Quote className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Pull Quote</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('callout')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-750 hover:border-blue-500 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Callout Box</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('image')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-750 hover:border-blue-500 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Media Image</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('divider')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-750 hover:border-blue-500 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5 text-slate-500" />
            <span>Divider</span>
          </button>
          <button
            type="button"
            onClick={() => addBlock('faq')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-750 hover:border-blue-500 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>FAQ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
