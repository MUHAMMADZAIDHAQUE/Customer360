import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  BarChart3,
  AlertTriangle,
  DollarSign,
  Award,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { BatchPredictionResponse, PredictionResponse } from '../types';
import { KPICard } from '../components/common/KPICard';
import { RiskBadge } from '../components/common/Badge';
import { SkeletonTable } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import { Modal } from '../components/common/Modal';

export const PredictionsView: React.FC = () => {
  const [data, setData] = useState<BatchPredictionResponse | null>(null);
  const [riskFilter, setRiskFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Single customer SHAP inspection modal
  const [inspectCustomerId, setInspectCustomerId] = useState<string | null>(null);
  const [shapData, setShapData] = useState<PredictionResponse | null>(null);
  const [isShapLoading, setIsShapLoading] = useState<boolean>(false);
  const [shapError, setShapError] = useState<string | null>(null);

  const loadPredictions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getPredictions(riskFilter, 100);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ML predictions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, [riskFilter]);

  const handleInspectShap = async (customerId: string) => {
    setInspectCustomerId(customerId);
    setIsShapLoading(true);
    setShapError(null);
    try {
      const pred = await api.getPrediction(customerId);
      setShapData(pred);
    } catch (err: any) {
      setShapError(err.message || 'Failed to execute real-time model inference');
    } finally {
      setIsShapLoading(false);
    }
  };

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);

  if (error) {
    return <ErrorState message={error} onRetry={loadPredictions} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#1e2d4d]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-purple-500" />
            Machine Learning Churn Predictions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Production XGBoost model inference scoring account attrition probabilities with local TreeSHAP attribution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            Model: {data?.model_version || 'v1.0.0 (XGBoost)'}
          </span>
          <button
            onClick={loadPredictions}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-[#0e1526] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#1e2d4d] shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Scores
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          title="Total Scored Accounts"
          value={data ? data.total_scored.toLocaleString() : '---'}
          subtitle="Evaluated across 20 engineered features"
          isLoading={isLoading}
          iconVariant="blue"
          icon={<BarChart3 className="w-4 h-4" />}
        />
        <KPICard
          title="High & Critical Risk"
          value={data ? data.high_or_critical_risk_count.toLocaleString() : '---'}
          subtitle="Accounts exceeding 50% probability"
          badge="Urgent"
          badgeVariant="danger"
          isLoading={isLoading}
          iconVariant="rose"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <KPICard
          title="Total ARR at Risk"
          value={data ? formatCurrency(data.total_arr_at_risk) : '---'}
          subtitle="Recurring capital exposure"
          badge="Exposure"
          badgeVariant="warning"
          isLoading={isLoading}
          iconVariant="amber"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <KPICard
          title="Model Discrimination"
          value="0.999"
          subtitle="ROC-AUC test score on held-out 20%"
          badge="Champion"
          badgeVariant="success"
          isLoading={isLoading}
          iconVariant="purple"
          icon={<Award className="w-4 h-4" />}
        />
      </div>

      {/* Filter Tabs by Risk Tier */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
          {['All', 'Critical', 'High', 'Medium', 'Low'].map((tier) => (
            <button
              key={tier}
              onClick={() => setRiskFilter(tier)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                riskFilter === tier
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tier} Risk
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:block">
          Showing {data?.items.length || 0} accounts
        </div>
      </div>

      {/* Predictions Leaderboard Table */}
      {isLoading ? (
        <SkeletonTable rows={10} />
      ) : (
        <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#121b2f] text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-[#1e2d4d]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Customer ID</th>
                  <th className="py-3 px-4 font-semibold text-center">Churn Probability</th>
                  <th className="py-3 px-4 font-semibold text-center">Risk Tier</th>
                  <th className="py-3 px-4 font-semibold text-right">ARR at Risk</th>
                  <th className="py-3 px-4 font-semibold">Primary Risk Factor</th>
                  <th className="py-3 px-4 font-semibold text-right">SHAP Explainability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1e2d4d]">
                {(data?.items || []).map((item) => (
                  <tr
                    key={item.customer_id}
                    className="hover:bg-slate-50 dark:hover:bg-[#141f36] transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {item.customer_id}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.probability >= 0.75
                                ? 'bg-rose-500'
                                : item.probability >= 0.5
                                ? 'bg-orange-500'
                                : item.probability >= 0.25
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, item.probability * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {(item.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <RiskBadge level={item.risk_level} probability={item.probability} />
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.annual_arr_at_risk)}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-700">
                        {item.primary_risk_factor}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleInspectShap(item.customer_id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors"
                      >
                        Explain SHAP ⚡
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Real-Time SHAP Inspector Modal */}
      <Modal
        isOpen={!!inspectCustomerId}
        onClose={() => setInspectCustomerId(null)}
        title={`Live SHAP Explainability: ${inspectCustomerId}`}
        subtitle="Real-time model inference and signed Shapley feature contributions"
        maxWidth="max-w-2xl"
      >
        {isShapLoading && (
          <div className="py-8 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
            <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
            <div className="h-32 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
          </div>
        )}

        {shapError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
            {shapError}
          </div>
        )}

        {!isShapLoading && shapData && (
          <div className="space-y-5">
            {/* Probability Card */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d]">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Predicted Churn Probability
                </span>
                <div className="text-3xl font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  {(shapData.probability * 100).toFixed(1)}%
                </div>
              </div>
              <RiskBadge level={shapData.risk_level} probability={shapData.probability} />
            </div>

            {/* Top Risk Drivers */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                <span>🔴</span> Positive SHAP Drivers (Increasing Churn Probability)
              </h3>
              <div className="space-y-1.5">
                {shapData.top_risk_factors.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/15 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {f.feature}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {f.description}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                      +{f.shap_value.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Protective Drivers */}
            {shapData.top_protective_factors && shapData.top_protective_factors.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#1e2d4d]">
                <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span>🟢</span> Negative SHAP Drivers (Preserving Retention)
                </h3>
                <div className="space-y-1.5">
                  {shapData.top_protective_factors.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {f.feature}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {f.description}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {f.shap_value.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
