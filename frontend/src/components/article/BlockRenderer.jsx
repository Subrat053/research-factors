import React, { useState } from 'react';
import { Info, AlertTriangle, Lightbulb, Quote as QuoteIcon, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeMediaUrl } from '../../services/media.api.js';

function FaqAccordionItem({ item, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        isOpen
          ? 'bg-white border-paper-border shadow-xs'
          : 'bg-paper/60 border-paper-border/80 hover:border-paper-border hover:bg-paper'
      }`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between text-left p-5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-rfblue/40 rounded-2xl select-none transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-ink-darkest text-base sm:text-lg pr-4 leading-snug">
          {item.question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
            isOpen
              ? 'bg-rfblue/10 text-rfblue'
              : 'bg-paper text-ink-light hover:text-rfblue'
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="faq-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: 'auto',
              opacity: 1,
              transition: {
                height: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.22, delay: 0.06 }
              }
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.15 }
              }
            }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t border-paper-border/60 text-base sm:text-lg leading-relaxed text-ink-muted">
              <p>{item.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function BlockRenderer({ blocks = [] }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="w-full space-y-4 lg:space-y-6 text-ink leading-relaxed">
      {blocks.map((block, idx) => {
        const { blockType, content, id } = block;
        const key = id || idx;

        switch (blockType) {
          // 1. Heading Block
          case 'heading': {
            const level = content?.level || 2;
            const text = content?.text || '';
            const anchorId = `heading-${idx}`;

            if (level === 2 || level === 1) {
              return (
                <h2
                  id={anchorId}
                  key={key}
                  className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-darkest pt-3 lg:pt-6 scroll-mt-24 border-b border-paper-border/60 pb-3"
                >
                  {text}
                </h2>
              );
            }
            return (
              <h3
                id={anchorId}
                key={key}
                className="text-xl sm:text-2xl font-semibold tracking-tight text-ink-darkest pt-2 lg:pt-4 scroll-mt-24"
              >
                {text}
              </h3>
            );
          }

          // 2. Paragraph Block
          case 'paragraph': {
            const hasRichHtml = Boolean(content?.html && content.html.includes('<'));

            if (hasRichHtml) {
              return (
                <div
                  key={key}
                  className="rich-prose text-base sm:text-lg text-ink-muted leading-relaxed font-normal"
                  dangerouslySetInnerHTML={{ __html: content.html }}
                />
              );
            }

            const displayText = content?.text || (typeof content === 'string' ? content : '');
            return (
              <p
                key={key}
                className="text-base sm:text-lg text-ink-muted leading-relaxed font-normal whitespace-pre-line"
              >
                {displayText}
              </p>
            );
          }

          // 3. Callout / Key Finding Block
          case 'callout': {
            const variant = content?.variant || content?.type || 'info';
            const isWarning = variant === 'warning';
            const isTip = variant === 'tip' || variant === 'success';
            const title = content?.title;
            const message = content?.text || content?.message || '';

            return (
              <div
                key={key}
                className={`my-8 p-6 rounded-2xl border ${
                  isWarning
                    ? 'bg-rfred-50/40 border-rfred-100 text-ink'
                    : isTip
                    ? 'bg-emerald-50/40 border-emerald-100 text-ink'
                    : 'bg-rfblue-50/40 border-rfblue-100 text-ink'
                } shadow-xs`}
              >
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isWarning
                        ? 'bg-rfred-100 text-rfred'
                        : isTip
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rfblue-100 text-rfblue'
                    }`}
                  >
                    {isWarning ? <AlertTriangle className="w-4 h-4" /> : isTip ? <Lightbulb className="w-4 h-4 text-emerald-700" /> : <Info className="w-4 h-4" />}
                  </div>
                  <div>
                    {title && (
                      <h4
                        className={`text-sm font-bold uppercase tracking-wider mb-1 ${
                          isWarning ? 'text-rfred' : isTip ? 'text-emerald-800' : 'text-rfblue'
                        }`}
                      >
                        {title}
                      </h4>
                    )}
                    <p className="text-base sm:text-lg leading-relaxed text-ink-muted">
                      {message}
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          // 4. Comparison Table / Matrix Block
          case 'table':
          case 'comparison': {
            const headers = Array.isArray(content?.headers) ? content.headers : [];
            const rawRows = Array.isArray(content?.rows) ? content.rows : [];

            // Normalize row format
            const normalizedRows = rawRows.map(r => {
              if (Array.isArray(r)) {
                return { label: r[0] || '', values: r.slice(1) };
              }
              return { label: r?.label || '', values: Array.isArray(r?.values) ? r.values : [] };
            });

            return (
              <div key={key} className="my-10 overflow-hidden rounded-2xl border border-paper-border bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-paper border-b border-paper-border text-xs uppercase tracking-wider text-ink-darkest font-bold">
                      <tr>
                        {headers.map((h, hIdx) => (
                          <th key={hIdx} className="py-3.5 px-5 first:pl-6 last:pr-6">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-paper-border/60">
                      {normalizedRows.map((r, rIdx) => (
                        <tr key={rIdx} className="hover:bg-paper/50 transition-colors">
                          <td className="py-4 px-5 first:pl-6 font-semibold text-ink-darkest whitespace-nowrap">
                            {r.label}
                          </td>
                          {r.values?.map((v, vIdx) => (
                            <td key={vIdx} className="py-4 px-5 text-ink-muted leading-snug">
                              {v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }

          // 5. Quote Block
          case 'quote': {
            const quoteText = content?.quote || content?.text || '';
            const author = content?.author || content?.citation || '';
            const source = content?.source || '';

            return (
              <figure key={key} className="my-10 pl-6 border-l-4 border-rfblue py-2">
                <blockquote className="text-xl sm:text-2xl italic font-medium text-ink-darkest leading-snug">
                  "{quoteText}"
                </blockquote>
                {(author || source) && (
                  <figcaption className="mt-3 text-xs uppercase tracking-wider text-ink-light font-bold">
                    — {author} {source && <cite className="font-normal not-italic text-ink-muted">({source})</cite>}
                  </figcaption>
                )}
              </figure>
            );
          }

          // 6. Image Block
          case 'image': {
            if (!content?.url) return null;
            return (
              <figure key={key} className="my-10">
                <div className="rounded-2xl overflow-hidden border border-paper-border shadow-xs bg-paper">
                  <img
                    src={normalizeMediaUrl(content.url)}
                    alt={content.alt || content.caption || 'Article research asset'}
                    className="w-full object-cover max-h-[560px]"
                    loading="lazy"
                  />
                </div>
                {content?.caption && (
                  <figcaption className="mt-2.5 text-center text-xs text-ink-light italic">
                    {content.caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          // 7. Video / External Embed
          case 'embed': {
            return (
              <div key={key} className="my-10 aspect-video rounded-2xl overflow-hidden border border-paper-border shadow-xs">
                <iframe
                  src={content?.url}
                  title={content?.caption || 'Video Embed'}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              </div>
            );
          }

          // 8. Divider
          case 'divider': {
            return (
              <hr key={key} className="my-12 border-0 h-px bg-paper-border max-w-xs mx-auto" />
            );
          }

          // 9. FAQ Accordion Block
          case 'faq': {
            const items = Array.isArray(content?.items) ? content.items : [];
            if (items.length === 0) return null;

            return (
              <div key={key} className="my-8 space-y-3.5">
                {items.map((item, i) => (
                  <FaqAccordionItem key={i} item={item} defaultOpen={false} />
                ))}
              </div>
            );
          }

          // 10. List Block
          case 'list': {
            const items = Array.isArray(content?.items) ? content.items : [];
            const ordered = Boolean(content?.ordered);
            if (items.length === 0) return null;

            if (ordered) {
              return (
                <ol key={key} className="my-6 space-y-3 pl-6 list-decimal marker:text-rfblue marker:font-semibold text-base sm:text-lg text-ink-muted">
                  {items.map((item, i) => (
                    <li key={i} className="pl-2 leading-relaxed">
                      {typeof item === 'string' ? item : item?.text || ''}
                    </li>
                  ))}
                </ol>
              );
            }

            return (
              <ul key={key} className="my-6 space-y-3 pl-6 list-disc marker:text-rfblue text-base sm:text-lg text-ink-muted">
                {items.map((item, i) => (
                  <li key={i} className="pl-2 leading-relaxed">
                    {typeof item === 'string' ? item : item?.text || ''}
                  </li>
                ))}
              </ul>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
