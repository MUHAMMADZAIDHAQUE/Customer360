import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CustomerDetail, PredictionResponse } from '../types';
import { Modal } from '../components/common/Modal';
import { RiskBadge, StatusBadge, PlanBadge } from '../components/common/Badge';

interface CustomerProfileModalProps {
  customerId: string | null;
  onClose: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  customerId,
  onClose,
}) => {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) {
      setCustomer(null);
      setPrediction(null);
      return;
    }

    const fetchCustomer = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [custData, predData] = await Promise.all([
          api.getCustomer(customerId),
          api.getPrediction(customerId).catch(() => null),
        ]);
        setCustomer(custData);
        setPrediction(predData);
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve customer 360 profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <Modal
      isOpen={!!customerId}
      onClose={onClose}
      title={customer ? `${customer.full_name}` : 'Customer 360 Profile'}
      subtitle={customer ? `${customer.customer_id} • ${customer.email} • ${customer.country}` : 'Loading...'}
      maxWidth="max-w-4xl"
    >
      {isLoading && (
        <div className="space-y-4 py-8 animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
            <div className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
            <div className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
          </div>
          <div className="h-40 bg-slate-100 dark:bg-slate-800/40 rounded-xl"></div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      {!isLoading && customer && (
        <div className="space-y-6">
          {/* Top Key Badges & Risk Overview */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d]">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={customer.customer_status} />
              <PlanBadge tier={customer.plan_tier} />
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                {customer.contract_type} contract
              </span>
              {customer.is_engagement_declining && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  ⚠️ Engagement Drop &gt;50%
                </span>
              )}
              {customer.has_support_friction && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  ⚠️ Support Friction
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                  ML Churn Probability
                </div>
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {prediction ? `${(prediction.probability * 100).toFixed(1)}%` : `${((customer.churn_probability || 0) * 100).toFixed(1)}%`}
                </div>
              </div>
              <RiskBadge
                level={prediction?.risk_level || customer.risk_tier}
                probability={prediction?.probability ?? customer.churn_probability}
              />
            </div>
          </div>

          {/* Grid: Financials & Subscription */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d]">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Monthly MRR</div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                {formatCurrency(customer.current_mrr)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Plan: {customer.plan_name}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d]">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Annual ARR</div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                {formatCurrency(customer.current_arr)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Run-rate</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d]">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Lifetime Realized</div>
              <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(customer.lifetime_billed_revenue)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{customer.total_invoices_count} invoices</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d]">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Account Tenure</div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                {customer.tenure_months} mo
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Joined {customer.signup_date || 'N/A'}</div>
            </div>
          </div>

          {/* Section: Telemetry & Engagement vs Support Friction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Engagement */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>📊</span> Product Usage &amp; Engagement
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Total Sessions:</span>
                  <p className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                    {customer.total_sessions}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Active Usage Days:</span>
                  <p className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                    {customer.total_active_days} days
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Total Minutes:</span>
                  <p className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                    {customer.total_session_minutes.toLocaleString()} mins
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Distinct Features:</span>
                  <p className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                    {customer.distinct_features_used} modules
                  </p>
                </div>
              </div>
            </div>

            {/* Support & Billing Health */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>🎧</span> Support &amp; Payment Integrity
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Total Tickets:</span>
                  <p className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                    {customer.total_tickets_count} ({customer.high_urgency_tickets_count} urgent)
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Avg Resolution:</span>
                  <p className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                    {customer.avg_resolution_hours} hrs
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">CSAT Satisfaction:</span>
                  <p className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                    ⭐ {customer.avg_satisfaction_score.toFixed(1)} / 5.0
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Payment Failures:</span>
                  <p
                    className={`font-mono font-semibold mt-0.5 ${
                      customer.failed_transactions_count > 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {customer.failed_transactions_count} failed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Churn Post-Mortem (if churned) */}
          {customer.is_churned && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-2">
              <div className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5 text-sm">
                <span>🔴</span> Churn Event Audit
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Cancellation Date:</span>
                  <p className="font-mono font-semibold text-slate-900 dark:text-white">{customer.churn_date || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Reported Reason:</span>
                  <p className="font-semibold text-slate-900 dark:text-white">{customer.churn_reason || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Cancellation Type:</span>
                  <p className="font-semibold text-slate-900 dark:text-white capitalize">{customer.churn_type || 'Voluntary'}</p>
                </div>
              </div>
              {customer.churn_feedback && (
                <div className="pt-1 text-slate-600 dark:text-slate-300 italic border-t border-rose-500/20">
                  "{customer.churn_feedback}"
                </div>
              )}
            </div>
          )}

          {/* ML SHAP Explainability Breakdown */}
          {prediction && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>🧠</span> Machine Learning SHAP Feature Attribution
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  Model: {prediction.model_version}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exact drivers elevating risk (+) vs protective drivers preserving retention (-):
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Top Risk Drivers */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                    Top Churn Risk Drivers (+)
                  </h4>
                  {prediction.top_risk_factors.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-rose-500/5 border border-rose-500/15">
                      <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">
                        {f.feature}
                      </span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        +{f.shap_value.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Top Protective Drivers */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    Top Retention Protective Drivers (-)
                  </h4>
                  {(prediction.top_protective_factors || []).map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-emerald-500/5 border border-emerald-500/15">
                      <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">
                        {f.feature}
                      </span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {f.shap_value.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
