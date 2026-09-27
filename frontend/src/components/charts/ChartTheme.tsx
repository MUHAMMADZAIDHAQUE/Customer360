import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const CHART_COLORS = {
  blue: '#3b82f6',
  indigo: '#6366f1',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#ef4444',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  slate: '#64748b',
};

export const PALETTE = [
  CHART_COLORS.blue,
  CHART_COLORS.emerald,
  CHART_COLORS.amber,
  CHART_COLORS.purple,
  CHART_COLORS.rose,
  CHART_COLORS.cyan,
  CHART_COLORS.indigo,
];

export const useChartStyles = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return {
    gridColor: isDark ? '#1e2d4d' : '#e2e8f0',
    axisTextColor: isDark ? '#94a3b8' : '#64748b',
    tooltipBg: isDark ? '#0e1526' : '#ffffff',
    tooltipBorder: isDark ? '#1e2d4d' : '#cbd5e1',
    tooltipText: isDark ? '#f8fafc' : '#0f172a',
    cursorColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
  };
};

export const CustomChartTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  label?: string;
  valueFormatter?: (val: any) => string;
}> = ({ active, payload, label, valueFormatter }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-lg shadow-lg px-3 py-2 text-xs font-sans z-50">
      {label && <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1 border-b border-slate-100 dark:border-slate-800 pb-1">{label}</p>}
      <div className="space-y-1">
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
              <span className="text-slate-500 dark:text-slate-400 capitalize">{item.name}:</span>
            </div>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {valueFormatter ? valueFormatter(item.value) : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
