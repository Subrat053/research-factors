import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fallbackPath = path.resolve(__dirname, '../../frontend/src/data/fallbackData.json');
const nexonJsonPath = path.resolve(__dirname, '../src/data/articles/tata-nexon-ev-petrol-diesel-cng-2026.json');

const fallbackData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
const nexonData = JSON.parse(fs.readFileSync(nexonJsonPath, 'utf8'));

// Format Nexon article for fallbackData.json
const nexonFallbackArticle = {
  id: 'art-fb-nexon-01',
  title: nexonData.title,
  slug: nexonData.slug,
  subtitle: nexonData.subtitle,
  excerpt: nexonData.excerpt,
  type: nexonData.type,
  status: 'PUBLISHED',
  isFeatured: true,
  readingTimeMin: nexonData.readingTimeMin || 8,
  coverImageUrl: nexonData.coverImageUrl,
  coverImageAlt: nexonData.coverImageAlt,
  publishedAt: '2026-10-03T10:00:00.000Z',
  viewCount: 420,
  commentCount: 6,
  category: {
    id: 'cat-auto',
    name: 'Automotive',
    slug: 'automotive'
  },
  author: {
    id: 'usr-fb-chen',
    fullName: 'Dr. Marcus Chen',
    firstName: 'Marcus',
    lastName: 'Chen',
    role: 'AUTHOR',
    authorProfile: {
      headline: 'Senior Powertrain & Battery Systems Research Analyst',
      bio: 'Dr. Chen specializes in automotive powertrain benchmarking, EV lifecycle efficiency, and comparative mobility economics.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    },
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  },
  tags: nexonData.tags.map((t, idx) => ({
    id: `tag-nexon-${idx + 1}`,
    name: t.name,
    slug: t.slug
  })),
  blocks: nexonData.blocks.map((b, idx) => ({
    id: `b-nexon-${String(idx + 1).padStart(2, '0')}`,
    blockType: b.blockType,
    content: b.content
  }))
};

// Companion article to maintain even count of 20
const companionArticle = {
  id: 'art-fb-auto-02',
  title: 'Electric Vehicles in India 2026: Battery Costs, Subsidies, and Charging Infrastructure Compared',
  slug: 'electric-vehicles-in-india-2026-battery-costs-subsidies-and-charging-infrastructure',
  subtitle: "A comprehensive evaluation of India's EV ecosystem in 2026, analyzing cell chemistry pricing trajectories, revised incentives, and highway fast-charging grid reliability.",
  excerpt: 'Analyzing battery cost reductions, revised subsidy frameworks, and highway charging accessibility across major Indian transit corridors in 2026.',
  type: 'RESEARCH',
  status: 'PUBLISHED',
  isFeatured: false,
  readingTimeMin: 7,
  coverImageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1200&q=80',
  coverImageAlt: 'Modern electric vehicle charging station with digital interface',
  publishedAt: '2026-09-28T08:00:00.000Z',
  viewCount: 380,
  commentCount: 4,
  category: {
    id: 'cat-auto',
    name: 'Automotive',
    slug: 'automotive'
  },
  author: {
    id: 'usr-fb-chen',
    fullName: 'Dr. Marcus Chen',
    firstName: 'Marcus',
    lastName: 'Chen',
    role: 'AUTHOR',
    authorProfile: {
      headline: 'Senior Powertrain & Battery Systems Research Analyst',
      bio: 'Dr. Chen specializes in automotive powertrain benchmarking, EV lifecycle efficiency, and comparative mobility economics.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    },
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  },
  tags: [
    { id: 'tag-ev-1', name: 'Electric Vehicles', slug: 'electric-vehicles' },
    { id: 'tag-ev-2', name: 'EV Charging', slug: 'ev-charging' },
    { id: 'tag-ev-3', name: 'Battery Technology', slug: 'battery-technology' },
    { id: 'tag-ev-4', name: 'Automotive Technology', slug: 'automotive-technology' }
  ],
  blocks: [
    {
      id: 'b-ev-01',
      blockType: 'paragraph',
      content: {
        text: "India's electric mobility landscape in 2026 has reached a pivotal tipping point. With LFP (Lithium Iron Phosphate) pack costs dropping below $82 per kWh globally and domestic pack assembly scaling across Tamil Nadu, Gujarat, and Maharashtra, vehicle price parity with internal combustion engines (ICE) is arriving across mass-market segments."
      }
    },
    {
      id: 'b-ev-02',
      blockType: 'heading',
      content: {
        level: 2,
        text: 'Cell Chemistry Economics & Domestic Assembly Milestones'
      }
    },
    {
      id: 'b-ev-03',
      blockType: 'paragraph',
      content: {
        text: 'The transition from imported NMC cylindrical cells to localized prismatic LFP architectures has reduced thermal runaway vulnerability during extreme 45°C summer ambients while slashing warranty replacement provisions for fleet operators by 38% year-over-year.'
      }
    },
    {
      id: 'b-ev-04',
      blockType: 'callout',
      content: {
        variant: 'tip',
        title: 'Highway Fast-Charging Density Milestone',
        text: 'Over 68% of national highways now feature DC fast-charging stations spaced within 60 km intervals, decreasing intercity range anxiety by 42% compared to 2024 survey baselines.'
      }
    }
  ]
};

// Filter out if already present to ensure idempotency
fallbackData.articles = fallbackData.articles.filter(
  (a) => a.slug !== nexonFallbackArticle.slug && a.slug !== companionArticle.slug
);

// Append new articles
fallbackData.articles.push(nexonFallbackArticle);
fallbackData.articles.push(companionArticle);

console.log(`✅ Articles total now: ${fallbackData.articles.length} (Even count: ${fallbackData.articles.length % 2 === 0})`);

fs.writeFileSync(fallbackPath, JSON.stringify(fallbackData, null, 2) + '\n', 'utf8');
console.log('🎉 Successfully updated frontend/src/data/fallbackData.json!');
