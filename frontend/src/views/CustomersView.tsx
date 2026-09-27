import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CustomerSummary, PaginatedResponse, CustomerFilterParams } from '../types';
import { RiskBadge, StatusBadge, PlanBadge } from '../components/common/Badge';
import { SkeletonTable } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { CustomerProfileModal } from './CustomerProfileModal';

export const CustomersView: React.FC = () => {
  const [data, setData] = useState<PaginatedResponse<CustomerSummary> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [planTier, setPlanTier] = useState<string>('');
  const [contractType, setContractType] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('current_arr');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Selected customer for modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: CustomerFilterParams = {
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        status: status || undefined,
        plan_tier: planTier || undefined,
        contract_type: contractType || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      const result = await api.getCustomers(params);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, pageSize, status, planTier, contractType, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setPlanTier('');
    setContractType('');
    setSortBy('current_arr');
    setSortOrder('desc');
    setPage(1);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#1e2d4d]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Customer Directory (360° Profiles)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Unified view across behavioral usage, recurring revenue, and predictive churn risk.
          </p>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          {data ? `Showing ${data.items.length} of ${data.total.toLocaleString()} accounts` : 'Loading accounts...'}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by customer name, email, or account ID (e.g. CUST-00001)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
          >
            Search
          </button>
          {(search || status || planTier || contractType) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Reset
            </button>
          )}
        </form>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-[#1e2d4d] text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d] text-slate-800 dark:text-slate-200"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="churned">Churned Only</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Plan Tier</label>
            <select
              value={planTier}
              onChange={(e) => {
                setPlanTier(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d] text-slate-800 dark:text-slate-200"
            >
              <option value="">All Tiers</option>
              <option value="Starter">Starter</option>
              <option value="Growth">Growth</option>
              <option value="Professional">Professional</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Contract</label>
            <select
              value={contractType}
              onChange={(e) => {
                setContractType(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d] text-slate-800 dark:text-slate-200"
            >
              <option value="">All Contracts</option>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
              <option value="multi_year">Multi-Year</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d] text-slate-800 dark:text-slate-200"
            >
              <option value="current_arr">Annual ARR</option>
              <option value="current_mrr">Monthly MRR</option>
              <option value="tenure_months">Tenure Months</option>
              <option value="total_sessions">Total Sessions</option>
              <option value="signup_date">Signup Date</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d] text-slate-800 dark:text-slate-200"
            >
              <option value="desc">Descending (High to Low)</option>
              <option value="asc">Ascending (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={fetchCustomers} />}

      {/* Customer Data Table */}
      {isLoading ? (
        <SkeletonTable rows={10} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No customers match your criteria"
          description="Try broadening your search term or adjusting filters to find accounts."
          onAction={handleResetFilters}
          actionLabel="Reset Filters"
        />
      ) : (
        <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#121b2f] text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-[#1e2d4d]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Plan &amp; Contract</th>
                  <th className="py-3 px-4 font-semibold">Tenure</th>
                  <th className="py-3 px-4 font-semibold text-right">Revenue (ARR / MRR)</th>
                  <th className="py-3 px-4 font-semibold text-center">Engagement</th>
                  <th className="py-3 px-4 font-semibold text-center">Churn Probability</th>
                  <th className="py-3 px-4 font-semibold text-center">Risk Level</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1e2d4d]">
                {data.items.map((cust) => (
                  <tr
                    key={cust.customer_id}
                    onClick={() => setSelectedCustomerId(cust.customer_id)}
                    className="hover:bg-slate-50 dark:hover:bg-[#141f36] cursor-pointer transition-colors"
                  >
                    {/* Customer Info */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {cust.full_name}
                        <StatusBadge status={cust.customer_status} />
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {cust.customer_id} • {cust.country}
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <PlanBadge tier={cust.plan_tier} />
                        <span className="text-slate-600 dark:text-slate-300 capitalize">{cust.contract_type}</span>
                      </div>
                    </td>

                    {/* Tenure */}
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {cust.tenure_months} mo
                    </td>

                    {/* Revenue */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(cust.current_arr)}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {formatCurrency(cust.current_mrr)}/mo
                      </div>
                    </td>

                    {/* Engagement */}
                    <td className="py-3 px-4 text-center">
                      <div className="font-mono text-slate-800 dark:text-slate-200">
                        {cust.total_sessions} sess
                      </div>
                      {cust.is_engagement_declining && (
                        <span className="text-[10px] text-amber-500 font-semibold">
                          ⚠️ Dropping
                        </span>
                      )}
                    </td>

                    {/* Churn Probability */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (cust.churn_probability || 0) >= 0.5 ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, (cust.churn_probability || 0) * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {((cust.churn_probability || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>

                    {/* Risk Level */}
                    <td className="py-3 px-4 text-center">
                      <RiskBadge level={cust.risk_tier} probability={cust.churn_probability} />
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomerId(cust.customer_id);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                      >
                        Profile →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-[#121b2f] border-t border-slate-200 dark:border-[#1e2d4d] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
              <div>
                Page <span className="font-semibold text-slate-900 dark:text-white">{data.page}</span> of{' '}
                <span className="font-semibold text-slate-900 dark:text-white">{data.total_pages}</span>
              </div>
              <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-3">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-0.5 rounded bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1e2d4d] bg-white dark:bg-[#0e1526] text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Previous
              </button>

              <button
                disabled={page >= data.total_pages || isLoading}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1e2d4d] bg-white dark:bg-[#0e1526] text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Profile Modal */}
      <CustomerProfileModal
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
      />
    </div>
  );
};
