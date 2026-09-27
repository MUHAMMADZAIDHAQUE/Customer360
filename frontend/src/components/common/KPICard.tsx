import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositiveChange?: boolean;
  icon?: React.ReactNode;
  tooltip?: string;
  isLoading?: boolean;
  badge?: string;
  badgeVariant?: 'danger' | 'warning' | 'success' | 'info';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositiveChange,
  icon,
  tooltip,
  isLoading,
  badge,
  badgeVariant = 'info',
}) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900/60 dark:bg-[#0e1526] bg-white border border-slate-200 dark:border-[#1e2d4d] rounded-xl p-5 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </div>
        <div className="h-8 w-36 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
        <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
    );
  }

  const badgeStyles = {
    danger: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  };

  return (
    <div className="group relative bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] hover:border-blue-500/40 dark:hover:border-blue-500/40 rounded-xl p-5 shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
            {title}
          </span>
          {tooltip && (
            <span
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help text-xs"
              title={tooltip}
            >
              ℹ️
            </span>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
          {value}
        </span>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeStyles[badgeVariant]}`}>
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs">
        {change && (
          <span
            className={`font-semibold flex items-center ${
              isPositiveChange
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isPositiveChange ? '↑' : '↓'} {change}
          </span>
        )}
        {subtitle && (
          <span className="text-slate-500 dark:text-slate-400 truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
