import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-paper-border overflow-hidden p-5 animate-pulse flex flex-col justify-between">
      <div>
        <div className="w-full h-48 bg-paper-border/60 rounded-xl mb-4" />
        <div className="flex items-center space-x-2 mb-3">
          <div className="h-4 w-20 bg-paper-border/80 rounded-full" />
          <div className="h-4 w-12 bg-paper-border/50 rounded-full" />
        </div>
        <div className="h-6 w-5/6 bg-paper-border/80 rounded mb-2" />
        <div className="h-4 w-full bg-paper-border/50 rounded mb-1.5" />
        <div className="h-4 w-4/5 bg-paper-border/50 rounded" />
      </div>
      <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-paper-border/50">
        <div className="w-8 h-8 rounded-full bg-paper-border/80" />
        <div className="h-3.5 w-24 bg-paper-border/70 rounded" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-pulse">
      <div className="h-4 w-32 bg-paper-border/80 rounded-full mb-6" />
      <div className="h-10 w-4/5 bg-paper-border/80 rounded mb-4" />
      <div className="h-5 w-3/5 bg-paper-border/50 rounded mb-8" />
      <div className="flex items-center space-x-4 mb-10 pb-6 border-b border-paper-border">
        <div className="w-12 h-12 rounded-full bg-paper-border/80" />
        <div>
          <div className="h-4 w-36 bg-paper-border/80 rounded mb-1.5" />
          <div className="h-3 w-24 bg-paper-border/50 rounded" />
        </div>
      </div>
      <div className="w-full h-96 bg-paper-border/60 rounded-2xl mb-12" />
      <div className="space-y-4 max-w-prose mx-auto">
        <div className="h-4 w-full bg-paper-border/60 rounded" />
        <div className="h-4 w-full bg-paper-border/60 rounded" />
        <div className="h-4 w-4/5 bg-paper-border/60 rounded" />
      </div>
    </div>
  );
}

export function ArticleListSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
