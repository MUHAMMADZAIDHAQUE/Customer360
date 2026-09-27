import React from 'react';

export const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-xl p-5 animate-pulse">
    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-3"></div>
    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mb-2"></div>
    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
  </div>
);

export const SkeletonChart: React.FC<{ height?: string }> = ({ height = 'h-72' }) => (
  <div className={`bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-xl p-5 ${height} animate-pulse flex flex-col justify-between`}>
    <div className="flex justify-between items-center">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
    </div>
    <div className="h-44 bg-slate-100 dark:bg-slate-800/40 rounded-lg flex items-end justify-around p-3 gap-2">
      <div className="h-24 bg-slate-200 dark:bg-slate-700/60 rounded w-full"></div>
      <div className="h-36 bg-slate-200 dark:bg-slate-700/60 rounded w-full"></div>
      <div className="h-20 bg-slate-200 dark:bg-slate-700/60 rounded w-full"></div>
      <div className="h-40 bg-slate-200 dark:bg-slate-700/60 rounded w-full"></div>
      <div className="h-28 bg-slate-200 dark:bg-slate-700/60 rounded w-full"></div>
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-xl p-4 animate-pulse">
    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-4"></div>
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded flex items-center px-3 gap-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/6"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/6"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/6"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/6"></div>
        </div>
      ))}
    </div>
  </div>
);
