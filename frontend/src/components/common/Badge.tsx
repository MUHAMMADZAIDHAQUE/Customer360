import React from 'react';

interface RiskBadgeProps {
  level?: string;
  probability?: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, probability }) => {
  const norm = (level || '').toLowerCase();
  
  let styles = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  let dotColor = 'bg-slate-400';
  let label = level || 'Unknown';

  if (norm === 'critical' || (probability !== undefined && probability >= 0.75)) {
    styles = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
    dotColor = 'bg-rose-500 animate-pulse';
    label = 'Critical';
  } else if (norm === 'high' || (probability !== undefined && probability >= 0.50)) {
    styles = 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
    dotColor = 'bg-orange-500';
    label = 'High';
  } else if (norm === 'medium' || (probability !== undefined && probability >= 0.25)) {
    styles = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    dotColor = 'bg-amber-500';
    label = 'Medium';
  } else {
    styles = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    dotColor = 'bg-emerald-500';
    label = 'Low';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
      {probability !== undefined && (
        <span className="opacity-80 font-mono text-[10px]">
          ({(probability * 100).toFixed(0)}%)
        </span>
      )}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const isChurned = status.toLowerCase() === 'churned';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        isChurned
          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isChurned ? 'bg-rose-500' : 'bg-emerald-500'}`} />
      {isChurned ? 'Churned' : 'Active'}
    </span>
  );
};

export const PlanBadge: React.FC<{ tier: string }> = ({ tier }) => {
  const styles: Record<string, string> = {
    enterprise: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    professional: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    growth: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    starter: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  };
  const key = (tier || '').toLowerCase();
  const applied = styles[key] || styles.starter;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${applied}`}>
      {tier}
    </span>
  );
};
