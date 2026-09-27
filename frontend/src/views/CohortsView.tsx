import React, { useState, useEffect, useMemo } from 'react';
import { Target, Zap, TrendingUp, Award } from 'lucide-react';
import { api } from '../services/api';
import { CohortMatrixRow } from '../types';
import { KPICard } from '../components/common/KPICard';
import { SkeletonTable } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';

export const CohortsView: React.FC = () => {
  const [cohorts, setCohorts] = useState<CohortMatrixRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadCohorts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getCohorts();
      setCohorts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load cohort retention matrix');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCohorts();
  }, []);

  // Compute key benchmark milestones across all cohorts
  const benchmarks = useMemo(() => {
    if (!cohorts.length) return { m1: 0, m3: 0, m6: 0, m12: 0 };
    const getAvg = (key: string) => {
      const valid = cohorts
        .map((c) => c.retention_percentages[key])
        .filter((v): v is number => typeof v === 'number');
      return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
    };
    return {
      m1: getAvg('M+1'),
      m3: getAvg('M+3'),
      m6: getAvg('M+6'),
      m12: getAvg('M+12'),
    };
  }, [cohorts]);

  // Color gradient helper for heatmap cells
  const getCellColor = (val: number | null | undefined) => {
    if (val === null || val === undefined) {
      return 'bg-transparent text-slate-300 dark:text-slate-700';
    }
    if (val >= 90) return 'bg-emerald-600/35 text-emerald-700 dark:text-emerald-300 font-bold';
    if (val >= 75) return 'bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-semibold';
    if (val >= 60) return 'bg-amber-500/25 text-amber-700 dark:text-amber-300 font-medium';
    if (val >= 45) return 'bg-orange-500/25 text-orange-700 dark:text-orange-300 font-medium';
    return 'bg-rose-500/25 text-rose-700 dark:text-rose-300 font-medium';
  };

  if (error) {
    return <ErrorState message={error} onRetry={loadCohorts} />;
  }

  const months = ['M+0', 'M+1', 'M+2', 'M+3', 'M+4', 'M+5', 'M+6', 'M+7', 'M+8', 'M+9', 'M+10', 'M+11', 'M+12'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#1e2d4d]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Cohort Retention Matrix &amp; Heatmap
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Signup-month triangular customer retention rates through 12 months of tenure.
          </p>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          {cohorts.length} Historical Signup Cohorts
        </div>
      </div>

      {/* Benchmark KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          title="Month 1 Retention"
          value={`${benchmarks.m1.toFixed(1)}%`}
          subtitle="Initial onboarding milestone"
          badge="Benchmark"
          badgeVariant="success"
          isLoading={isLoading}
          iconVariant="blue"
          icon={<Target className="w-4 h-4" />}
        />
        <KPICard
          title="Month 3 Retention"
          value={`${benchmarks.m3.toFixed(1)}%`}
          subtitle="Habit formation milestone"
          badge="Critical"
          badgeVariant="info"
          isLoading={isLoading}
          iconVariant="purple"
          icon={<Zap className="w-4 h-4" />}
        />
        <KPICard
          title="Month 6 Retention"
          value={`${benchmarks.m6.toFixed(1)}%`}
          subtitle="Mid-lifecycle retention"
          badge="Mid-term"
          badgeVariant="warning"
          isLoading={isLoading}
          iconVariant="amber"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <KPICard
          title="Month 12 Retention"
          value={`${benchmarks.m12.toFixed(1)}%`}
          subtitle="Annual renewal milestone"
          badge="Long-term"
          badgeVariant="success"
          isLoading={isLoading}
          iconVariant="emerald"
          icon={<Award className="w-4 h-4" />}
        />
      </div>

      {/* Heatmap Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Retention Intensity Legend:</span>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-600/35 text-emerald-600 dark:text-emerald-300 font-semibold text-[10px]">
            &gt;= 90%
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
            75% - 89%
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-500/25 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
            60% - 74%
          </span>
          <span className="px-2 py-0.5 rounded bg-orange-500/25 text-orange-600 dark:text-orange-400 font-semibold text-[10px]">
            45% - 59%
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-500/25 text-rose-600 dark:text-rose-400 font-semibold text-[10px]">
            &lt; 45%
          </span>
        </div>
      </div>

      {/* Cohort Heatmap Table */}
      {isLoading ? (
        <SkeletonTable rows={12} />
      ) : (
        <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-[#121b2f] text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-[#1e2d4d]">
                <tr>
                  <th className="py-3 px-4 font-semibold sticky left-0 bg-slate-50 dark:bg-[#121b2f] z-10">
                    Cohort Month
                  </th>
                  <th className="py-3 px-3 font-semibold text-center border-r border-slate-200 dark:border-[#1e2d4d]">
                    Cohort Size
                  </th>
                  {months.map((m) => (
                    <th key={m} className="py-3 px-2 font-semibold text-center min-w-[58px]">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1e2d4d]">
                {cohorts.map((c) => (
                  <tr key={c.cohort_month} className="hover:bg-slate-50/50 dark:hover:bg-[#141f36]/40">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-[#0e1526] z-10 border-r border-slate-100 dark:border-[#1e2d4d]">
                      {c.cohort_month}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-[#1e2d4d]">
                      {c.cohort_size}
                    </td>
                    {months.map((m) => {
                      const val = c.retention_percentages[m];
                      return (
                        <td
                          key={m}
                          className={`py-2 px-1 text-center font-mono text-[11px] transition-colors ${getCellColor(
                            val
                          )}`}
                        >
                          {val !== null && val !== undefined ? `${val.toFixed(1)}%` : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
