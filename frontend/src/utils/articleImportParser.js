/**
 * Article Import & AI Content Parser
 * Converts pasted text from ChatGPT, Claude, Word, Google Docs, Markdown,
 * and HTML into structured Research Factors ArticleBlock[] objects.
 */

/**
 * Strips dangerous HTML tags and inline attributes to prevent XSS.
 * Pure browser/DOM based sanitization.
 */
export function sanitizeRawHtml(htmlString) {
  if (!htmlString || typeof htmlString !== 'string') return '';

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Strip script, style, iframe, object, embed
    const dangerous = doc.querySelectorAll('script, style, iframe, object, embed, applet');
    dangerous.forEach(el => el.remove());

    // Strip on* event attributes and javascript: URLs
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        const name = attr.name.toLowerCase();
        const val = attr.value.trim().toLowerCase();
        if (name.startsWith('on') || val.startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return doc.body.innerHTML || '';
  }

  // Fallback for non-browser/SSR/node test environments
  return htmlString
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\son\w+=[^\s>]+/gi, '')
    .replace(/href=["']javascript:[^"']*["']/gi, 'href="#"');
}

/**
 * Converts inline markdown (bold, italic, links, code) into semantic HTML
 */
export function inlineMarkdownToHtml(text = '') {
  return String(text)
    // Links: [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="editorial-link">$1</a>')
    // Bold: **text** or __text__
    .replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>')
    // Italic: *text* or _text_
    .replace(/(\*|_)(.*?)\1/g, '<em>$2</em>')
    // Inline code: `code`
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-paper text-ink font-mono text-sm">$1</code>')
    // Strikethrough: ~~text~~
    .replace(/~~(.*?)~~/g, '<s>$1</s>');
}

/**
 * Parses Markdown tables into { headers, rows }
 */
function parseMarkdownTable(tableLines) {
  if (!Array.isArray(tableLines) || tableLines.length < 2) return null;

  const cleanRow = (line) =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim());

  const headers = cleanRow(tableLines[0]);
  // Line 1 is typically separator |---|---|
  const dataRows = tableLines.slice(2).map(cleanRow);

  const rows = dataRows
    .filter(r => r.length > 0 && r.some(cell => cell.length > 0))
    .map(r => {
      const label = r[0] || '';
      const values = r.slice(1);
      return { label, values };
    });

  if (headers.length === 0 || rows.length === 0) return null;

  return { headers, rows };
}

/**
 * Parses raw text into semantic ArticleBlock[] objects
 * @param {string} rawInput - Markdown, HTML, or plain text
 * @returns {Array} Array of ArticleBlock objects
 */
export function parseImportContent(rawInput = '') {
  if (!rawInput || !rawInput.trim()) return [];

  const text = rawInput.trim();
  const blocks = [];
  let blockIndex = 0;

  const createBlock = (blockType, content, metadata = {}) => ({
    id: `block-import-${Date.now()}-${blockIndex++}-${Math.random().toString(36).substr(2, 4)}`,
    blockType,
    position: blocks.length,
    content,
    metadata
  });

  // Check if input is predominantly HTML (e.g. from Google Docs or Word rich clipboard)
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(text) && (text.includes('<p>') || text.includes('<h2>') || text.includes('<table>'));

  if (isHtml) {
    const cleanHtml = sanitizeRawHtml(text);
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanHtml, 'text/html');
    const nodes = Array.from(doc.body.children);

    for (const node of nodes) {
      const tag = node.tagName.toLowerCase();

      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
        const level = tag === 'h1' ? 1 : tag === 'h2' ? 2 : 3;
        blocks.push(createBlock('heading', { level, text: node.textContent.trim() }));
      } else if (tag === 'p') {
        const nodeText = node.textContent.trim();
        if (nodeText) {
          blocks.push(createBlock('paragraph', { text: nodeText, html: node.innerHTML }));
        }
      } else if (tag === 'table') {
        const ths = Array.from(node.querySelectorAll('thead th, tr:first-child th')).map(th => th.textContent.trim());
        const trs = Array.from(node.querySelectorAll('tbody tr, tr:not(:first-child)'));
        const rows = trs.map(tr => {
          const cells = Array.from(tr.querySelectorAll('td, th')).map(c => c.textContent.trim());
          return { label: cells[0] || '', values: cells.slice(1) };
        }).filter(r => r.label || r.values.length > 0);

        if (ths.length > 0 && rows.length > 0) {
          blocks.push(createBlock('table', { headers: ths, rows }));
        }
      } else if (tag === 'blockquote') {
        const text = node.textContent.trim();
        blocks.push(createBlock('quote', { quote: text, author: 'Cited Source', text }));
      } else if (tag === 'ul' || tag === 'ol') {
        const items = Array.from(node.querySelectorAll('li')).map(li => li.textContent.trim()).filter(Boolean);
        if (items.length > 0) {
          blocks.push(createBlock('list', { ordered: tag === 'ol', items }));
        }
      } else if (tag === 'hr') {
        blocks.push(createBlock('divider', {}));
      }
    }

    if (blocks.length > 0) return blocks;
  }

  // Markdown line-by-line parser
  const lines = text.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. Headings: #, ##, ###
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      blocks.push(createBlock('heading', { level, text: headingText }));
      i++;
      continue;
    }

    // 3. Dividers: --- or ***
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push(createBlock('divider', {}));
      i++;
      continue;
    }

    // 4. Markdown Tables: starts with | and contains |
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && lines[i + 1]?.trim().startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const tableContent = parseMarkdownTable(tableLines);
      if (tableContent) {
        blocks.push(createBlock('table', tableContent));
        continue;
      }
    }

    // 5. Callouts: > [!NOTE], > [!TIP], > [!WARNING], > [!IMPORTANT]
    const calloutMatch = trimmed.match(/^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/i);
    if (calloutMatch) {
      const rawType = calloutMatch[1].toUpperCase();
      let variant = 'info';
      if (rawType === 'WARNING' || rawType === 'CAUTION') variant = 'warning';
      else if (rawType === 'TIP') variant = 'tip';

      const title = calloutMatch[2].trim() || (rawType.charAt(0) + rawType.slice(1).toLowerCase());
      i++;

      const calloutTextLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        calloutTextLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }

      blocks.push(
        createBlock('callout', {
          variant,
          type: variant,
          title,
          text: calloutTextLines.join('\n').trim()
        })
      );
      continue;
    }

    // 6. Blockquote: standard > text
    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      const fullQuote = quoteLines.join(' ').trim();
      // Check for citation like — Author Name
      const authorMatch = fullQuote.match(/(?:—|--|-)\s*(.+)$/);
      const author = authorMatch ? authorMatch[1].trim() : '';
      const quoteText = authorMatch ? fullQuote.slice(0, authorMatch.index).trim() : fullQuote;

      blocks.push(createBlock('quote', { quote: quoteText, author, text: quoteText }));
      continue;
    }

    // 7. Lists: Bullet list (*, -) or Ordered list (1.)
    const isBullet = /^[\*\-\+]\s+/.test(trimmed);
    const isNumbered = /^\d+\.\s+/.test(trimmed);

    if (isBullet || isNumbered) {
      const items = [];
      const ordered = isNumbered;

      while (i < lines.length) {
        const itemLine = lines[i].trim();
        const itemMatch = ordered
          ? itemLine.match(/^\d+\.\s+(.*)$/)
          : itemLine.match(/^[\*\-\+]\s+(.*)$/);

        if (!itemMatch) break;
        items.push(itemMatch[1].trim());
        i++;
      }

      if (items.length > 0) {
        blocks.push(createBlock('list', { ordered, items }));
        continue;
      }
    }

    // 8. Paragraph (default multi-line block until next blank line or special token)
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('---') &&
      !/^[\*\-\+]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }

    if (paraLines.length > 0) {
      const rawPara = paraLines.join('\n');
      const html = inlineMarkdownToHtml(rawPara);
      blocks.push(createBlock('paragraph', { text: rawPara, html }));
    }
  }

  return blocks;
}

/**
 * Inspects raw text and returns element counts for the import modal summary
 * @param {string} text - Raw input text
 * @returns {Object} Metric counts of detected elements
 */
export function inspectImportContent(text = '') {
  if (!text || !text.trim()) {
    return {
      totalBlocks: 0,
      headings: 0,
      paragraphs: 0,
      tables: 0,
      lists: 0,
      callouts: 0,
      quotes: 0
    };
  }

  const parsed = parseImportContent(text);
  const counts = {
    totalBlocks: parsed.length,
    headings: 0,
    paragraphs: 0,
    tables: 0,
    lists: 0,
    callouts: 0,
    quotes: 0
  };

  for (const b of parsed) {
    if (b.blockType === 'heading') counts.headings++;
    else if (b.blockType === 'paragraph') counts.paragraphs++;
    else if (b.blockType === 'table') counts.tables++;
    else if (b.blockType === 'list') counts.lists++;
    else if (b.blockType === 'callout') counts.callouts++;
    else if (b.blockType === 'quote') counts.quotes++;
  }

  return counts;
}
