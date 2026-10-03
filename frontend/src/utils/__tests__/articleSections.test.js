import { describe, it, expect } from 'vitest';
import {
  blocksToSections,
  sectionsToBlocks,
  duplicateSection,
  getSectionMetrics
} from '../articleSections.js';

describe('articleSections Utility', () => {
  const sampleBlocks = [
    {
      id: 'b1',
      blockType: 'paragraph',
      position: 0,
      content: { text: 'Intro paragraph text here.' }
    },
    {
      id: 'b2',
      blockType: 'heading',
      position: 1,
      content: { level: 2, text: 'First Major Section' }
    },
    {
      id: 'b3',
      blockType: 'paragraph',
      position: 2,
      content: { text: 'Body paragraph inside first section.' }
    },
    {
      id: 'b4',
      blockType: 'heading',
      position: 3,
      content: { level: 2, text: 'Second Major Section' }
    },
    {
      id: 'b5',
      blockType: 'table',
      position: 4,
      content: {
        headers: ['Metric', 'Value'],
        rows: [{ label: 'Speed', values: ['100'] }]
      }
    }
  ];

  describe('blocksToSections', () => {
    it('returns default intro section when blocks array is empty', () => {
      const sections = blocksToSections([]);
      expect(sections).toHaveLength(1);
      expect(sections[0].id).toBe('sec-intro');
      expect(sections[0].title).toBe('Introduction');
      expect(sections[0].blocks).toEqual([]);
    });

    it('partitions flat blocks into Intro and subsequent H2 sections', () => {
      const sections = blocksToSections(sampleBlocks);
      expect(sections).toHaveLength(3);

      // Section 1: Introduction
      expect(sections[0].title).toBe('Introduction');
      expect(sections[0].blocks).toHaveLength(1);
      expect(sections[0].blocks[0].id).toBe('b1');

      // Section 2: First Major Section
      expect(sections[1].title).toBe('First Major Section');
      expect(sections[1].headingBlockId).toBe('b2');
      expect(sections[1].blocks).toHaveLength(2); // heading + paragraph

      // Section 3: Second Major Section
      expect(sections[2].title).toBe('Second Major Section');
      expect(sections[2].headingBlockId).toBe('b4');
      expect(sections[2].blocks).toHaveLength(2); // heading + table
    });
  });

  describe('sectionsToBlocks', () => {
    it('returns empty array when sections is empty', () => {
      expect(sectionsToBlocks([])).toEqual([]);
    });

    it('flattens sections back into continuous blocks with reindexed positions', () => {
      const sections = blocksToSections(sampleBlocks);
      const flat = sectionsToBlocks(sections);

      expect(flat).toHaveLength(5);
      expect(flat.map(b => b.position)).toEqual([0, 1, 2, 3, 4]);
      expect(flat[0].id).toBe('b1');
      expect(flat[1].id).toBe('b2');
      expect(flat[2].id).toBe('b3');
      expect(flat[3].id).toBe('b4');
      expect(flat[4].id).toBe('b5');
    });

    it('syncs heading block text if section.title was updated', () => {
      const sections = blocksToSections(sampleBlocks);
      sections[1].title = 'Updated Section Title';

      const flat = sectionsToBlocks(sections);
      expect(flat[1].content.text).toBe('Updated Section Title');
    });
  });

  describe('duplicateSection', () => {
    it('clones section and generates fresh IDs for section and blocks', () => {
      const sections = blocksToSections(sampleBlocks);
      const targetSection = sections[1];
      const cloned = duplicateSection(targetSection);

      expect(cloned.id).not.toBe(targetSection.id);
      expect(cloned.title).toBe(`${targetSection.title} (Copy)`);
      expect(cloned.blocks).toHaveLength(targetSection.blocks.length);
      expect(cloned.blocks[0].id).not.toBe(targetSection.blocks[0].id);
      expect(cloned.headingBlockId).toBe(cloned.blocks[0].id);
    });
  });

  describe('getSectionMetrics', () => {
    it('calculates block distribution and word counts', () => {
      const sections = blocksToSections(sampleBlocks);
      const metrics = getSectionMetrics(sections[1]);

      expect(metrics.totalBlocks).toBe(2);
      expect(metrics.typeCounts.headings).toBe(1);
      expect(metrics.typeCounts.paragraphs).toBe(1);
      expect(metrics.wordCount).toBeGreaterThan(0);
      expect(metrics.previewText).toContain('Body paragraph');
    });
  });
});
