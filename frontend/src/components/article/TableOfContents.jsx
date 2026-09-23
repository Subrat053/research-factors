import React, { useEffect, useState } from 'react';
import { List } from 'lucide-react';

export function TableOfContents({ headings = [] }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (!headings || headings.length === 0) return;

    // Set first heading as default active if at top of page
    if (!activeId && headings[0]?.id) {
      setActiveId(headings[0].id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible intersecting headings
        const visibleEntries = entries.filter(e => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // Choose the topmost intersecting element
          const topVisible = visibleEntries.reduce((prev, curr) =>
            prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
          );
          setActiveId(topVisible.target.id);
        }
      },
      {
        rootMargin: '-80px 0% -65% 0%',
        threshold: 0
      }
    );

    headings.forEach((heading) => {
      const id = heading.id || `heading-${heading.index}`;
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings, activeId]);

  if (!headings || headings.length === 0) return null;

  const scrollToHeading = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      try {
        history.pushState(null, '', `#${id}`);
      } catch {
        // Fallback if security restriction
      }
      setActiveId(id);
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-ink-darkest pb-3 mb-3 border-b border-paper-border">
        <List className="w-4 h-4 text-rfblue" />
        <span>Table of Contents</span>
      </div>
      <nav className="space-y-1" aria-label="Table of contents">
        {headings.map((heading, idx) => {
          const id = heading.id || `heading-${idx}`;
          const isActive = activeId === id;
          const isSubheading = heading.level === 3;

          return (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => scrollToHeading(e, id)}
              className={`group flex items-center py-1.5 px-2 text-xs rounded-lg transition-all duration-150 leading-relaxed cursor-pointer ${
                isSubheading ? 'pl-6 text-[11px]' : ''
              } ${
                isActive
                  ? 'bg-rfblue-50  text-rfblue  font-bold'
                  : 'text-ink-muted hover:text-ink-darkest hover:bg-paper'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-2 shrink-0 transition-colors ${
                  isActive
                    ? 'bg-rfblue'
                    : 'bg-paper-border group-hover:bg-ink-light'
                }`}
              />
              <span className="truncate">{heading.text}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
