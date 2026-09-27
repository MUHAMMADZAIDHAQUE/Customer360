import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api } from '../services/api';
import {
  ExecutiveMetrics,
  ChurnTrend,
  ChurnByContract,
  ChurnByPlan,
  SegmentSummary,
  ChurnSummary,
} from '../types';
import { KPICard } from '../components/common/KPICard';
import { SkeletonChart } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import {
  CHART_COLORS,
  PALETTE,
  useChartStyles,
  CustomChartTooltip,
} from '../components/charts/ChartTheme';

export const DashboardView: React.FC = () => {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [trends, setTrends] = useState<ChurnTrend[]>([]);
  const [byContract, setByContract] = useState<ChurnByContract[]>([]);
  const [byPlan, setByPlan] = useState<ChurnByPlan[]>([]);
  const [segments, setSegments] = useState<SegmentSummary[]>([]);
  const [churnSummary, setChurnSummary] = useState<ChurnSummary | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const chartStyles = useChartStyles();

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [m, t, c, p, s, cs] = await Promise.all([
        api.getMetrics(),
        api.getChurnTrends(),
        api.getChurnByContract(),
        api.getChurnByPlan(),
        api.getSegments(),
        api.getChurnSummary(),
      ]);
      setMetrics(m);
      setTrends(t);
      setByContract(c);
      setByPlan(p);
      setSegments(s);
      setChurnSummary(cs);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Unable to connect to FastAPI backend');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboardData} />;
  }

  // Format currency
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);

  // Top churn drivers from summary
  const topDrivers = churnSummary?.top_churn_reasons.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#1e2d4d]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Executive Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Understand customers. Predict churn. Protect revenue. Live analytical metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#0e1526] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#1e2d4d] shadow-sm transition-all"
          >
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      {/* 6 Authoritative KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Customers"
          value={metrics ? metrics.total_customers.toLocaleString() : '---'}
          subtitle="Portfolio accounts"
          isLoading={isLoading}
          icon={<span>👥</span>}
        />
        <KPICard
          title="Active Customers"
          value={metrics ? metrics.active_customers.toLocaleString() : '---'}
          subtitle={`${metrics ? metrics.retention_rate_pct.toFixed(1) : 0}% active retention`}
          badge={metrics ? `${metrics.retention_rate_pct.toFixed(0)}%` : undefined}
          badgeVariant="success"
          isLoading={isLoading}
          icon={<span>🟢</span>}
        />
        <KPICard
          title="Churn Rate"
          value={metrics ? `${metrics.churn_rate_pct.toFixed(1)}%` : '---'}
          subtitle={`${metrics ? metrics.churned_customers : 0} cancellations`}
          badge="Annualized"
          badgeVariant="danger"
          isLoading={isLoading}
          icon={<span>📉</span>}
        />
        <KPICard
          title="Retention Rate"
          value={metrics ? `${metrics.retention_rate_pct.toFixed(1)}%` : '---'}
          subtitle="Active cohort benchmark"
          badge="Healthy"
          badgeVariant="success"
          isLoading={isLoading}
          icon={<span>🛡️</span>}
        />
        <KPICard
          title="Monthly MRR"
          value={metrics ? formatCurrency(metrics.active_mrr) : '---'}
          subtitle={`ARR: ${metrics ? formatCurrency(metrics.active_arr) : '---'}`}
          badge={`ARPU ${metrics ? formatCurrency(metrics.arpu) : ''}`}
          badgeVariant="info"
          isLoading={isLoading}
          icon={<span>💰</span>}
        />
        <KPICard
          title="Revenue at Risk"
          value={metrics ? formatCurrency(metrics.total_revenue_at_risk) : '---'}
          subtitle={`${metrics ? metrics.at_risk_accounts_count : 0} vulnerable accounts`}
          badge="Critical"
          badgeVariant="warning"
          isLoading={isLoading}
          icon={<span>⚠️</span>}
        />
      </div>

      {/* 6 Key Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Churn Trend */}
        <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Monthly Churn Rate Trend
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Timeline of monthly churn % across all subscription tiers
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Monthly %
            </span>
          </div>
          {isLoading ? (
            <SkeletonChart />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridColor} />
                  <XAxis dataKey="observation_month" stroke={chartStyles.axisTextColor} tick={{ fontSize: 11 }} />
                  <YAxis stroke={chartStyles.axisTextColor} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip content={<CustomChartTooltip valueFormatter={(v) => `${v}%`} />} />
                  <Line
                    type="monotone"
                    dataKey="monthly_churn_rate_pct"
                    name="Churn Rate"
                    stroke={CHART_COLORS.rose}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: CHART_COLORS.rose }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: Revenue Trend */}
        <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Recurring Revenue Run Rate (MRR)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Active monthly subscription cash flow over observation months
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              USD ($)
            </span>
          </div>
          {isLoading ? (
            <SkeletonChart />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridColor} />
                  <XAxis dataKey="observation_month" stroke={chartStyles.axisTextColor} tick={{ fontSize: 11 }} />
                  <YAxis stroke={chartStyles.axisTextColor} tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip content={<CustomChartTooltip valueFormatter={(v) => formatCurrency(v)} />} />
                  <Bar dataKey="active_mrr" name="Active MRR" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 3: Churn by Contract */}
        <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Churn Rate by Contract Type
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly commitments exhibit 3x higher churn risk than annual commitments
              </p>
            </div>
          </div>
          {isLoading ? (
            <SkeletonChart />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byContract} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridColor} />
                  <XAxis dataKey="contract_type" stroke={chartStyles.axisTextColor} tick={{ fontSize: 11 }} />
                  <YAxis stroke={chartStyles.axisTextColor} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip content={<CustomChartTooltip valueFormatter={(v) => `${v}%`} />} />
                  <Bar dataKey="churn_rate_pct" name="Churn Rate" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]}>
                    {byContract.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.contract_type === 'monthly' ? CHART_COLORS.rose : CHART_COLORS.emerald}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 4: Churn by Plan */}
        <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Churn Rate by Subscription Plan Tier
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluation across Starter, Growth, Professional, and Enterprise
              </p>
            </div>
          </div>
          {isLoading ? (
            <SkeletonChart />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byPlan} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridColor} />
                  <XAxis dataKey="plan_tier" stroke={chartStyles.axisTextColor} tick={{ fontSize: 11 }} />
                  <YAxis stroke={chartStyles.axisTextColor} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip content={<CustomChartTooltip valueFormatter={(v) => `${v}%`} />} />
                  <Bar dataKey="churn_rate_pct" name="Churn Rate" fill={CHART_COLORS.purple} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 5: Customer Segments Distribution */}
        <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Customer Segments (RFM Clustering)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customer count distribution across quantitative behavioral segments
              </p>
            </div>
          </div>
          {isLoading ? (
            <SkeletonChart />
          ) : (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomChartTooltip valueFormatter={(v) => `${v} accounts`} />} />
                  <Pie
                    data={segments}
                    dataKey="customer_count"
                    nameKey="rfm_segment"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {segments.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ fontSize: '11px', color: chartStyles.axisTextColor }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 6: Top Churn Drivers */}
        <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Top Cancellation Reasons
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Primary self-reported cancellation drivers and support friction
              </p>
            </div>
          </div>
          {isLoading ? (
            <SkeletonChart />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topDrivers}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 50, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridColor} horizontal={false} />
                  <XAxis type="number" stroke={chartStyles.axisTextColor} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="reason"
                    stroke={chartStyles.axisTextColor}
                    tick={{ fontSize: 10 }}
                    width={90}
                  />
                  <Tooltip content={<CustomChartTooltip valueFormatter={(v) => `${v} cancellations`} />} />
                  <Bar dataKey="count" name="Cancellations" fill={CHART_COLORS.rose} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
