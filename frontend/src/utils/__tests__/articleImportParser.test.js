import { describe, it, expect } from 'vitest';
import {
  sanitizeRawHtml,
  inlineMarkdownToHtml,
  parseImportContent,
  inspectImportContent
} from '../articleImportParser.js';

describe('articleImportParser Utility', () => {
  describe('sanitizeRawHtml', () => {
    it('strips script tags and inline event handlers', () => {
      const dirty = '<p>Safe text <script>alert("xss")</script><img src="x" onerror="steal()"></p>';
      const clean = sanitizeRawHtml(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('onerror');
      expect(clean).toContain('Safe text');
    });

    it('strips iframes and javascript: URLs', () => {
      const dirty = '<iframe src="evil.com"></iframe><a href="javascript:attack()">Click</a>';
      const clean = sanitizeRawHtml(dirty);
      expect(clean).not.toContain('<iframe');
      expect(clean).not.toContain('javascript:');
    });
  });

  describe('inlineMarkdownToHtml', () => {
    it('converts bold, italic, code, and links to HTML', () => {
      const md = 'This is **bold** and *italic* with `inline code` and a [link](https://example.com).';
      const html = inlineMarkdownToHtml(md);

      expect(html).toContain('<strong>bold</strong>');
      expect(html).toContain('<em>italic</em>');
      expect(html).toContain('<code');
      expect(html).toContain('<a href="https://example.com"');
    });
  });

  describe('parseImportContent', () => {
    it('returns empty array on empty input', () => {
      expect(parseImportContent('')).toEqual([]);
      expect(parseImportContent('   ')).toEqual([]);
    });

    it('parses markdown headings, paragraphs, and dividers', () => {
      const input = `
# Title Heading
Introductory paragraph explaining the research context.

---

## Second Section
Another paragraph here.
`;
      const blocks = parseImportContent(input);

      expect(blocks.length).toBeGreaterThanOrEqual(4);
      expect(blocks[0].blockType).toBe('heading');
      expect(blocks[0].content.level).toBe(1);
      expect(blocks[0].content.text).toBe('Title Heading');

      expect(blocks[1].blockType).toBe('paragraph');
      expect(blocks[1].content.text).toContain('Introductory paragraph');

      expect(blocks[2].blockType).toBe('divider');

      expect(blocks[3].blockType).toBe('heading');
      expect(blocks[3].content.level).toBe(2);
      expect(blocks[3].content.text).toBe('Second Section');
    });

    it('parses markdown tables correctly', () => {
      const input = `
| Powertrain | Price | Efficiency |
|---|---|---|
| Petrol | 10 Lakh | 17 kmpl |
| Diesel | 11 Lakh | 23 kmpl |
`;
      const blocks = parseImportContent(input);
      const tableBlock = blocks.find(b => b.blockType === 'table');

      expect(tableBlock).toBeDefined();
      expect(tableBlock.content.headers).toEqual(['Powertrain', 'Price', 'Efficiency']);
      expect(tableBlock.content.rows).toHaveLength(2);
      expect(tableBlock.content.rows[0].label).toBe('Petrol');
      expect(tableBlock.content.rows[0].values).toEqual(['10 Lakh', '17 kmpl']);
    });

    it('parses GitHub-style callouts correctly', () => {
      const input = `
> [!NOTE] Key Takeaway
> Electric vehicles require a home charging setup for optimal economics.
`;
      const blocks = parseImportContent(input);
      const calloutBlock = blocks.find(b => b.blockType === 'callout');

      expect(calloutBlock).toBeDefined();
      expect(calloutBlock.content.title).toBe('Key Takeaway');
      expect(calloutBlock.content.text).toContain('Electric vehicles require');
    });

    it('parses blockquotes and citations correctly', () => {
      const input = `
> "Research is formalized curiosity. It is poking and prying with a purpose." — Zora Neale Hurston
`;
      const blocks = parseImportContent(input);
      const quoteBlock = blocks.find(b => b.blockType === 'quote');

      expect(quoteBlock).toBeDefined();
      expect(quoteBlock.content.author).toBe('Zora Neale Hurston');
      expect(quoteBlock.content.quote).toContain('formalized curiosity');
    });

    it('parses bullet and numbered lists', () => {
      const input = `
- Feature One
- Feature Two
- Feature Three
`;
      const blocks = parseImportContent(input);
      const listBlock = blocks.find(b => b.blockType === 'list');

      expect(listBlock).toBeDefined();
      expect(listBlock.content.ordered).toBe(false);
      expect(listBlock.content.items).toEqual(['Feature One', 'Feature Two', 'Feature Three']);
    });
  });

  describe('inspectImportContent', () => {
    it('returns element counts accurately', () => {
      const input = `
## Section One
Paragraph one.

- Bullet 1
- Bullet 2

| Col 1 | Col 2 |
|---|---|
| A | B |
`;
      const counts = inspectImportContent(input);

      expect(counts.headings).toBe(1);
      expect(counts.paragraphs).toBe(1);
      expect(counts.lists).toBe(1);
      expect(counts.tables).toBe(1);
      expect(counts.totalBlocks).toBe(4);
    });
  });
});
