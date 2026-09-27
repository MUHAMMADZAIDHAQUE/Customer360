import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DataQualityReport } from '../types';
import { KPICard } from '../components/common/KPICard';
import { SkeletonTable } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';

export const DataQualityView: React.FC = () => {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDataQuality = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDataQuality();
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load data quality validation audit');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDataQuality();
  }, []);

  if (error) {
    return <ErrorState message={error} onRetry={loadDataQuality} />;
  }

  const checks = report?.checks || [];
  const categories = Array.from(new Set(checks.map((c) => c.category || 'Integrity')));

  const filteredChecks = filterCategory === 'all'
    ? checks
    : checks.filter((c) => (c.category || 'Integrity') === filterCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#1e2d4d]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>🛡️</span> Data Quality &amp; Foundation Hygiene Scorecard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Automated schema verification, orphan foreign key checks, impossible state assertions, and date bounds.
          </p>
        </div>
        <button
          onClick={loadDataQuality}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#0e1526] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#1e2d4d] shadow-sm transition-all"
        >
          <span>🔄</span> Re-Audit Dataset
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Hygiene Compliance Score"
          value={report ? `${report.score_pct.toFixed(1)}%` : '---'}
          subtitle={report ? report.status : 'Evaluating'}
          badge={report?.status === 'PASSED' ? 'Certified' : 'Audit'}
          badgeVariant="success"
          isLoading={isLoading}
          icon={<span>✅</span>}
        />
        <KPICard
          title="Total Rules Evaluated"
          value={report ? report.total_rules : '---'}
          subtitle="Automated integrity rules"
          isLoading={isLoading}
          icon={<span>📋</span>}
        />
        <KPICard
          title="Passed Assertions"
          value={report ? report.passed_rules : '---'}
          subtitle="Zero data violations found"
          badge="100% Pass"
          badgeVariant="success"
          isLoading={isLoading}
          icon={<span>🟢</span>}
        />
        <KPICard
          title="Failed Assertions"
          value={report ? report.failed_rules : 0}
          subtitle="Anomalies or orphan keys"
          badge={report?.failed_rules === 0 ? 'Clean' : 'Needs Fix'}
          badgeVariant={report?.failed_rules === 0 ? 'success' : 'danger'}
          isLoading={isLoading}
          icon={<span>🔍</span>}
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold uppercase text-[10px] shrink-0">Filter Category:</span>
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            filterCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-[#0e1526] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#1e2d4d]'
          }`}
        >
          All Rules ({checks.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-[#0e1526] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#1e2d4d]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Rules Table */}
      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : (
        <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#121b2f] text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-[#1e2d4d]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Rule / Validation Check</th>
                  <th className="py-3 px-4 font-semibold">Table Target</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold">Details &amp; Audit Results</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1e2d4d]">
                {filteredChecks.map((chk, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-[#141f36] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {chk.rule_name}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {chk.table}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {chk.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          chk.status === 'PASSED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {chk.status === 'PASSED' ? '✓ Passed' : '✕ Failed'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {chk.details}
                    </td>
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
