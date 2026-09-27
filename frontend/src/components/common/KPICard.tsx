import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositiveChange?: boolean;
  icon?: React.ReactNode;
  iconVariant?: 'blue' | 'emerald' | 'rose' | 'amber' | 'purple' | 'slate';
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
  iconVariant = 'blue',
  tooltip,
  isLoading,
  badge,
  badgeVariant = 'info',
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-2xl p-4 sm:p-5 shadow-sm animate-pulse min-w-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0"></div>
        </div>
        <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
    );
  }

  const badgeStyles = {
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  };

  const iconStyles = {
    blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    rose: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-500/20',
    amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-500/20',
    purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-500/20',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  };

  return (
    <div className="group relative bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] hover:border-blue-500/40 dark:hover:border-blue-500/40 rounded-2xl p-4 sm:p-5 shadow-sm transition-all duration-200 flex flex-col justify-between min-w-0">
      {/* Top Header: Title & Icon Container */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 truncate">
            {title}
          </span>
          {tooltip && (
            <span
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help text-[11px] shrink-0"
              title={tooltip}
            >
              ℹ️
            </span>
          )}
        </div>
        {icon && (
          <div
            className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
              iconStyles[iconVariant] || iconStyles.blue
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Metric Value & Badge */}
      <div className="flex flex-wrap items-baseline gap-2 mb-1.5 min-h-[32px]">
        <span className="text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono truncate">
          {value}
        </span>
        {badge && (
          <span
            className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${badgeStyles[badgeVariant]}`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Subtitle & Trend */}
      <div className="flex items-center gap-1.5 text-xs min-w-0">
        {change && (
          <span
            className={`font-semibold flex items-center shrink-0 ${
              isPositiveChange
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isPositiveChange ? '↑' : '↓'} {change}
          </span>
        )}
        {subtitle && (
          <span className="text-slate-500 dark:text-slate-400 truncate text-[11px] sm:text-xs">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

