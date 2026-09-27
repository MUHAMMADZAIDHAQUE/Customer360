import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { api } from '../services/api';
import { SegmentSummary } from '../types';
import { SkeletonCard, SkeletonChart } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import {
  PALETTE,
  useChartStyles,
  CustomChartTooltip,
} from '../components/charts/ChartTheme';

export const SegmentsView: React.FC = () => {
  const [segments, setSegments] = useState<SegmentSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const chartStyles = useChartStyles();

  const loadSegments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getSegments();
      setSegments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer segments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSegments();
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);

  if (error) {
    return <ErrorState message={error} onRetry={loadSegments} />;
  }

  const totalSegmentARR = segments.reduce((acc, s) => acc + s.total_active_arr, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#1e2d4d]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Customer Segmentation (RFM Behavioral Clusters)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Recency, Frequency, and Monetary quantitative behavioral segmentation with targeted retention playbooks.
          </p>
        </div>
        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          Total Segment ARR: {formatCurrency(totalSegmentARR)}
        </div>
      </div>

      {/* Visual Chart: ARR Contribution by Segment */}
      <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Active Recurring Revenue (ARR) by Segment
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Contribution of each behavioral cohort to active subscription run-rate
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            ARR ($)
          </span>
        </div>
        {isLoading ? (
          <SkeletonChart height="h-64" />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segments} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridColor} />
                <XAxis dataKey="rfm_segment" stroke={chartStyles.axisTextColor} tick={{ fontSize: 11 }} />
                <YAxis
                  stroke={chartStyles.axisTextColor}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomChartTooltip valueFormatter={(v) => formatCurrency(v)} />} />
                <Bar dataKey="total_active_arr" name="Active ARR" radius={[4, 4, 0, 0]}>
                  {segments.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detailed Segment Cards with Action Playbooks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : segments.map((seg, idx) => {
              const isHighRisk = seg.churn_rate_pct >= 40;
              const color = PALETTE[idx % PALETTE.length];

              return (
                <div
                  key={seg.rfm_segment}
                  className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] hover:border-blue-500/40 rounded-xl p-5 shadow-sm flex flex-col justify-between transition-all"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {seg.rfm_segment}
                        </h3>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          isHighRisk
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {seg.churn_rate_pct.toFixed(1)}% Churn
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 dark:border-[#1e2d4d] text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Total Accounts:</span>
                        <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                          {seg.customer_count.toLocaleString()}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({seg.active_count} active)
                          </span>
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Active ARR:</span>
                        <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {formatCurrency(seg.total_active_arr)}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Avg Realized CLV:</span>
                        <p className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {formatCurrency(seg.avg_clv)}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Churned Count:</span>
                        <p className="font-mono font-semibold text-rose-500 mt-0.5">
                          {seg.churned_count} accounts
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Playbook */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1e2d4d]">
                    <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider block mb-1">
                      Actionable Retention Playbook:
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#121b2f] p-2.5 rounded-lg border border-slate-200/60 dark:border-[#1e2d4d]/60">
                      {seg.retention_playbook}
                    </p>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
};
