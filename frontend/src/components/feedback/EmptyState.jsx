import React from 'react';
import { BookOpen } from 'lucide-react';

export function EmptyState({
  icon: Icon = BookOpen,
  title = 'No research found',
  description = 'There are currently no published articles matching this criteria.',
  action = null
}) {
  return (
    <div className="text-center py-16 px-4 bg-white rounded-2xl border border-paper-border max-w-lg mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-rfblue-50 text-rfblue flex items-center justify-center mx-auto mb-4 border border-rfblue-100">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-card-title text-ink-darkest mb-2">{title}</h3>
      <p className="text-sm text-ink-muted leading-relaxed max-w-sm mx-auto mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
