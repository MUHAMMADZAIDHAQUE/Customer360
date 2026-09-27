import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
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
import { RevenueSummary, RevenueAtRiskResponse } from '../types';
import { KPICard } from '../components/common/KPICard';
import { RiskBadge, PlanBadge } from '../components/common/Badge';
import { SkeletonChart, SkeletonTable } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import {
  CHART_COLORS,
  PALETTE,
  useChartStyles,
  CustomChartTooltip,
} from '../components/charts/ChartTheme';
import { CustomerProfileModal } from './CustomerProfileModal';

export const RevenueView: React.FC = () => {
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [atRisk, setAtRisk] = useState<RevenueAtRiskResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const chartStyles = useChartStyles();

  const loadRevenueData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [revData, riskData] = await Promise.all([
        api.getRevenueSummary(),
        api.getRevenueAtRisk(25),
      ]);
      setRevenue(revData);
      setAtRisk(riskData);
    } catch (err: any) {
      setError(err.message || 'Failed to load revenue analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRevenueData();
  }, []);

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);

  if (error) {
    return <ErrorState message={error} onRetry={loadRevenueData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#1e2d4d]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Revenue Analytics &amp; Capital Protection
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Recurring subscription run rates, plan contributions, and at-risk contract exposure.
          </p>
        </div>
        <button
          onClick={loadRevenueData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#0e1526] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#1e2d4d] shadow-sm transition-all"
        >
          <span>🔄</span> Refresh Financials
        </button>
      </div>

      {/* 5 Prominent KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Monthly MRR"
          value={revenue ? formatCurrency(revenue.total_mrr) : '---'}
          subtitle="Active monthly run-rate"
          badge="Live"
          badgeVariant="info"
          isLoading={isLoading}
          icon={<span>💵</span>}
        />
        <KPICard
          title="Annual ARR"
          value={revenue ? formatCurrency(revenue.total_arr) : '---'}
          subtitle="Contracted run-rate"
          badge="Annualized"
          badgeVariant="success"
          isLoading={isLoading}
          icon={<span>📊</span>}
        />
        <KPICard
          title="ARPU (Average / Account)"
          value={revenue ? formatCurrency(revenue.arpu) : '---'}
          subtitle="Per active subscriber / mo"
          badge="Monthly"
          badgeVariant="info"
          isLoading={isLoading}
          icon={<span>👤</span>}
        />
        <KPICard
          title="Total Realized CLV"
          value={revenue ? formatCurrency(revenue.total_realized_clv) : '---'}
          subtitle="Gross collected cash"
          badge="Collected"
          badgeVariant="success"
          isLoading={isLoading}
          icon={<span>🏦</span>}
        />
        <KPICard
          title="Revenue at Risk"
          value={atRisk ? formatCurrency(atRisk.total_arr_at_risk) : '---'}
          subtitle={`${atRisk ? atRisk.at_risk_account_count : 0} vulnerable accounts`}
          badge="Exposure"
          badgeVariant="danger"
          isLoading={isLoading}
          icon={<span>⚠️</span>}
        />
      </div>

      {/* Charts: Plan Contribution & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Plan ARR Contribution */}
        <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                ARR Contribution by Plan Tier
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Annual revenue distribution across Starter, Growth, Pro, and Enterprise
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              ARR ($)
            </span>
          </div>
          {isLoading ? (
            <SkeletonChart height="h-64" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue?.plan_breakdown || []} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridColor} />
                  <XAxis dataKey="plan_name" stroke={chartStyles.axisTextColor} tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke={chartStyles.axisTextColor}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomChartTooltip valueFormatter={(v) => formatCurrency(v)} />} />
                  <Bar dataKey="plan_arr" name="Plan ARR" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]}>
                    {(revenue?.plan_breakdown || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: ARR Share % Donut */}
        <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Revenue Portfolio Concentration (%)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Percentage of total ARR driven by each subscription tier
              </p>
            </div>
          </div>
          {isLoading ? (
            <SkeletonChart height="h-64" />
          ) : (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomChartTooltip valueFormatter={(v) => `${v}%`} />} />
                  <Pie
                    data={revenue?.plan_breakdown || []}
                    dataKey="arr_share_pct"
                    nameKey="plan_name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {(revenue?.plan_breakdown || []).map((_, index) => (
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
      </div>

      {/* Top High-Value Accounts at Risk Table */}
      <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#1e2d4d] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>⚠️</span> Top High-Value Accounts at Risk
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active accounts exhibiting severe engagement drop, support friction, or payment delinquency.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
            {atRisk ? formatCurrency(atRisk.total_arr_at_risk) : '$0'} At Risk
          </span>
        </div>

        {isLoading ? (
          <SkeletonTable rows={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#121b2f] text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-[#1e2d4d]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Account</th>
                  <th className="py-3 px-4 font-semibold">Plan &amp; Contract</th>
                  <th className="py-3 px-4 font-semibold text-right">ARR at Risk</th>
                  <th className="py-3 px-4 font-semibold text-center">CSAT / Tickets</th>
                  <th className="py-3 px-4 font-semibold">Friction Drivers</th>
                  <th className="py-3 px-4 font-semibold text-center">Risk Level</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1e2d4d]">
                {(atRisk?.accounts || []).map((acct) => (
                  <tr
                    key={acct.customer_id}
                    onClick={() => setSelectedCustomerId(acct.customer_id)}
                    className="hover:bg-slate-50 dark:hover:bg-[#141f36] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {acct.full_name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {acct.customer_id} • {acct.country}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <PlanBadge tier={acct.plan_tier} />
                        <span className="text-slate-600 dark:text-slate-300 capitalize">{acct.contract_type}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                        {formatCurrency(acct.annual_arr_at_risk)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono">
                      ⭐ {acct.avg_satisfaction_score.toFixed(1)} ({acct.total_tickets_count} tix)
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {acct.is_engagement_declining && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                            Engagement Drop
                          </span>
                        )}
                        {acct.has_support_friction && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-medium">
                            Support Friction
                          </span>
                        )}
                        {acct.has_payment_delinquency && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-medium">
                            Delinquent
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <RiskBadge level={acct.risk_tier} probability={acct.churn_probability} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomerId(acct.customer_id);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                      >
                        Intervene →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CustomerProfileModal
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
      />
    </div>
  );
};
