/**
 * Utility functions for mapping between flat ArticleBlock[] arrays and
 * structured Chapter/Section outlines in the Section Builder.
 *
 * An article's sections are demarcated by Heading blocks (level: 2 or 1).
 * Blocks preceding the first H2 are grouped into an "Introduction" section.
 */

/**
 * Groups flat blocks into structured sections based on major heading boundaries.
 * @param {Array} blocks - Array of ArticleBlock objects
 * @returns {Array} Array of Section objects
 */
export function blocksToSections(blocks = []) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return [
      {
        id: 'sec-intro',
        title: 'Introduction',
        headingBlockId: null,
        blocks: []
      }
    ];
  }

  const sections = [];
  let currentSection = {
    id: 'sec-intro',
    title: 'Introduction',
    headingBlockId: null,
    blocks: []
  };

  for (const block of blocks) {
    const isMajorHeading =
      block.blockType === 'heading' &&
      (block.content?.level === 2 || block.content?.level === 1 || !block.content?.level);

    if (isMajorHeading) {
      // If the current section already has blocks (or it is not the empty initial intro), push it
      if (currentSection.blocks.length > 0 || currentSection.headingBlockId) {
        sections.push(currentSection);
      }

      const headingText = block.content?.text || 'Untitled Section';
      const secId = `sec-${block.id || Date.now() + Math.random().toString(36).substr(2, 4)}`;

      currentSection = {
        id: secId,
        title: headingText,
        headingBlockId: block.id,
        blocks: [block]
      };
    } else {
      currentSection.blocks.push(block);
    }
  }

  if (currentSection.blocks.length > 0 || currentSection.headingBlockId) {
    sections.push(currentSection);
  }

  // If no sections were created at all, provide a default
  if (sections.length === 0) {
    sections.push({
      id: 'sec-intro',
      title: 'Introduction',
      headingBlockId: null,
      blocks: []
    });
  }

  return sections;
}

/**
 * Flattens structured sections back into a single continuous ArticleBlock[] array,
 * recalculating sequential positions 0..N-1 and keeping section titles in sync.
 * @param {Array} sections - Array of Section objects
 * @returns {Array} Flattened and re-indexed ArticleBlock[] array
 */
export function sectionsToBlocks(sections = []) {
  if (!Array.isArray(sections) || sections.length === 0) {
    return [];
  }

  const flatBlocks = [];
  let position = 0;

  for (const section of sections) {
    const sectionBlocks = section.blocks || [];

    for (let i = 0; i < sectionBlocks.length; i++) {
      const block = { ...sectionBlocks[i] };

      // If this block is the section's primary heading, keep its text in sync with section.title
      if (
        block.blockType === 'heading' &&
        (block.id === section.headingBlockId || i === 0) &&
        section.title &&
        block.content?.text !== section.title
      ) {
        block.content = {
          ...block.content,
          text: section.title,
          level: block.content?.level || 2
        };
      }

      block.position = position++;
      flatBlocks.push(block);
    }
  }

  return flatBlocks;
}

/**
 * Creates a duplicate of a section with fresh IDs for the section and all its blocks.
 * @param {Object} section - The section to duplicate
 * @returns {Object} New Section object with cloned blocks and unique IDs
 */
export function duplicateSection(section) {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substr(2, 6);
  const newSectionId = `sec-${timestamp}-${rand}`;
  const newHeadingBlockId = `block-${timestamp}-h-${rand}`;

  const clonedBlocks = (section.blocks || []).map((b, idx) => {
    const isHeading = b.id === section.headingBlockId || idx === 0;
    const newId = isHeading ? newHeadingBlockId : `block-${timestamp}-${idx}-${rand}`;

    return {
      ...b,
      id: newId,
      content: JSON.parse(JSON.stringify(b.content || {})),
      metadata: b.metadata ? JSON.parse(JSON.stringify(b.metadata)) : {}
    };
  });

  return {
    ...section,
    id: newSectionId,
    title: `${section.title || 'Section'} (Copy)`,
    headingBlockId: newHeadingBlockId,
    blocks: clonedBlocks
  };
}

/**
 * Calculates a summary of block types and estimated word count for a section
 * @param {Object} section - The section to inspect
 * @returns {Object} Summary counts and preview text
 */
export function getSectionMetrics(section) {
  const blocks = section.blocks || [];
  let wordCount = 0;
  const typeCounts = {
    paragraphs: 0,
    headings: 0,
    tables: 0,
    callouts: 0,
    quotes: 0,
    images: 0,
    lists: 0,
    faqs: 0,
    others: 0
  };

  let previewText = '';

  for (const b of blocks) {
    const type = b.blockType;
    if (type === 'paragraph') {
      typeCounts.paragraphs++;
      const text = b.content?.text || '';
      if (!previewText && text) previewText = text.slice(0, 140);
      wordCount += text.split(/\s+/).filter(Boolean).length;
    } else if (type === 'heading') {
      typeCounts.headings++;
      const text = b.content?.text || '';
      wordCount += text.split(/\s+/).filter(Boolean).length;
    } else if (type === 'table' || type === 'comparison') {
      typeCounts.tables++;
    } else if (type === 'callout') {
      typeCounts.callouts++;
      const text = `${b.content?.title || ''} ${b.content?.text || ''}`;
      wordCount += text.split(/\s+/).filter(Boolean).length;
    } else if (type === 'quote') {
      typeCounts.quotes++;
      const text = b.content?.quote || b.content?.text || '';
      wordCount += text.split(/\s+/).filter(Boolean).length;
    } else if (type === 'image') {
      typeCounts.images++;
    } else if (type === 'list') {
      typeCounts.lists++;
      const items = b.content?.items || [];
      for (const item of items) {
        const itemText = typeof item === 'string' ? item : item?.text || '';
        wordCount += itemText.split(/\s+/).filter(Boolean).length;
      }
    } else if (type === 'faq') {
      typeCounts.faqs++;
    } else {
      typeCounts.others++;
    }
  }

  return {
    totalBlocks: blocks.length,
    wordCount,
    typeCounts,
    previewText: previewText ? `${previewText.trim()}...` : 'Empty section. Add paragraphs, tables, or research blocks.'
  };
}
