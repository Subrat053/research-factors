import React from 'react';
import { List } from 'lucide-react';

export function TableOfContents({ headings }) {
  if (!headings || headings.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-paper-border p-6 shadow-xs">
      <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-ink-darkest mb-4">
        <List className="w-4 h-4 text-rfblue" />
        <span>Table of Contents</span>
      </div>
      <nav className="space-y-2">
        {headings.map((heading, idx) => (
          <a
            key={idx}
            href={`#heading-${idx}`}
            className={`block text-xs text-ink-muted hover:text-rfblue hover:underline transition-colors ${
              heading.level === 3 ? 'pl-4 text-ink-light' : 'font-medium'
            }`}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  );
}
