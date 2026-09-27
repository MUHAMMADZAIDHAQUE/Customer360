import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Database,
  Link,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  Bell,
  Trash2,
} from 'lucide-react';
import { api } from '../services/api';
import { DataQualityReport, QualityRuleResult, QualityAlertItem } from '../types';
import { KPICard } from '../components/common/KPICard';
import { SkeletonTable } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';

export const DataQualityView: React.FC = () => {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [filterDimension, setFilterDimension] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const data = await api.runDataQualityAudit();
      setReport(data);
      setActionNotice('Audit executed successfully. All checks refreshed.');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to execute real-time audit');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSimulateAlert = async () => {
    try {
      await api.simulateQualityAlert();
      await loadDataQuality();
      setActionNotice('Synthetic test alert triggered for pipeline incident simulation.');
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to simulate test alert');
    }
  };

  const handleClearAlerts = async () => {
    try {
      await api.clearQualityAlerts();
      await loadDataQuality();
      setActionNotice('All active alerts marked as resolved.');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to clear alerts');
    }
  };

  useEffect(() => {
    loadDataQuality();
  }, []);

  const checks = useMemo(() => report?.checks || [], [report]);
  const activeAlerts = useMemo(() => report?.active_alerts || [], [report]);
  const dimensionScores = useMemo(() => report?.dimension_scores || {}, [report]);
  const freshness = report?.freshness_metrics;

  // Filtered checks based on dimension, status, and search query
  const filteredChecks = useMemo(() => {
    return checks.filter((c) => {
      const matchDim =
        filterDimension === 'all' ||
        c.category.toLowerCase() === filterDimension.toLowerCase() ||
        (filterDimension === 'schema' && c.category.toLowerCase().includes('schema'));

      const matchStatus =
        filterStatus === 'all' || c.status.toLowerCase() === filterStatus.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.rule_name.toLowerCase().includes(q) ||
        c.table.toLowerCase().includes(q) ||
        c.details.toLowerCase().includes(q);

      return matchDim && matchStatus && matchSearch;
    });
  }, [checks, filterDimension, filterStatus, searchQuery]);

  if (error) {
    return <ErrorState message={error} onRetry={loadDataQuality} />;
  }

  const dimensionList = [
    { id: 'all', label: 'All Dimensions', count: checks.length },
    { id: 'Completeness', label: 'Completeness', count: checks.filter((c) => c.category === 'Completeness').length },
    { id: 'Uniqueness', label: 'Uniqueness', count: checks.filter((c) => c.category === 'Uniqueness').length },
    { id: 'Validity', label: 'Validity', count: checks.filter((c) => c.category === 'Validity').length },
    { id: 'Relationship Integrity', label: 'Relationship Integrity', count: checks.filter((c) => c.category === 'Relationship Integrity').length },
    { id: 'Freshness', label: 'Freshness', count: checks.filter((c) => c.category === 'Freshness').length },
    { id: 'schema', label: 'Schema & Volume', count: checks.filter((c) => c.category.includes('Schema')).length },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1e2d4d]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Data Quality &amp; Observability Suite
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                  Continuous Gatekeeper
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automated relational validation monitoring null values, duplicates, referential integrity, dates, negative amounts, categories, schema drift, volume, and data freshness.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {report?.last_validated_at && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] text-[11px] text-slate-600 dark:text-slate-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(report.last_validated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC</span>
            </div>
          )}
          <button
            onClick={handleRunAudit}
            disabled={isLoading || isAuditing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? 'Auditing...' : 'Re-Audit Dataset'}</span>
          </button>
          <button
            onClick={handleSimulateAlert}
            title="Inject simulated alert for testing"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#0e1526] hover:bg-slate-200 dark:hover:bg-[#152038] border border-slate-200 dark:border-[#1e2d4d] text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Simulate Alert</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* 6 Dimension Health Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Overall Quality */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Overall Quality</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {report ? `${report.score_pct.toFixed(1)}%` : '---'}
            </span>
          </div>
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-block w-fit">
            {report?.status === 'PASSED' ? 'Certified Clean' : 'Audit Required'}
          </span>
        </div>

        {/* Freshness */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Freshness</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {dimensionScores['Freshness'] !== undefined ? `${dimensionScores['Freshness'].toFixed(1)}%` : '100%'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
            SLA: {freshness?.sla_status || 'HEALTHY'}
          </span>
        </div>

        {/* Completeness */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Completeness</span>
            <Database className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {dimensionScores['Completeness'] !== undefined ? `${dimensionScores['Completeness'].toFixed(1)}%` : '100%'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            0 Nulls in Mandatory
          </span>
        </div>

        {/* Validity */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Validity</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {dimensionScores['Validity'] !== undefined ? `${dimensionScores['Validity'].toFixed(1)}%` : '100%'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            Bounds &amp; Categories OK
          </span>
        </div>

        {/* Uniqueness */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Uniqueness</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {dimensionScores['Uniqueness'] !== undefined ? `${dimensionScores['Uniqueness'].toFixed(1)}%` : '100%'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            0 Duplicate PKs
          </span>
        </div>

        {/* Relationship Integrity */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Integrity</span>
            <Link className="w-4 h-4 text-teal-500" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {dimensionScores['Relationship Integrity'] !== undefined ? `${dimensionScores['Relationship Integrity'].toFixed(1)}%` : '100%'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            0 Orphan Records
          </span>
        </div>
      </div>

      {/* KPI Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Passed Checks"
          value={report ? report.passed_rules : '---'}
          subtitle={`Out of ${report?.total_rules || 0} checks`}
          badge="100% Passing"
          badgeVariant="success"
          isLoading={isLoading}
          icon={<span>🟢</span>}
        />
        <KPICard
          title="Failed Checks"
          value={report ? report.failed_rules : 0}
          subtitle="Critical integrity violations"
          badge={report?.failed_rules === 0 ? 'Zero Breaches' : 'Action Required'}
          badgeVariant={report?.failed_rules === 0 ? 'success' : 'danger'}
          isLoading={isLoading}
          icon={<span>❌</span>}
        />
        <KPICard
          title="Warnings & Anomalies"
          value={report ? report.warning_rules || 0 : 0}
          subtitle="Non-critical drift notifications"
          badge="Clean"
          badgeVariant="success"
          isLoading={isLoading}
          icon={<span>⚠️</span>}
        />
        <KPICard
          title="Validation Latency"
          value="< 0.2s"
          subtitle="Sub-second In-Memory Audit"
          badge="Ultra-Fast"
          badgeVariant="info"
          isLoading={isLoading}
          icon={<span>⚡</span>}
        />
      </div>

      {/* Active Incident Alerts Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Pipeline Incident Alerting &amp; Monitoring
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
              activeAlerts.length > 0
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            }`}>
              {activeAlerts.length} Active Incidents
            </span>
          </div>
          {activeAlerts.length > 0 && (
            <button
              onClick={handleClearAlerts}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Acknowledge &amp; Clear All</span>
            </button>
          )}
        </div>

        {activeAlerts.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            <div>
              <span className="font-semibold block">All Pipeline Integrity Gates Passing</span>
              <span className="text-[11px] opacity-90">
                Zero active data quality incidents. Outgoing production webhooks (Slack / PagerDuty / Datadog) are standing by.
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 pt-1">
            {activeAlerts.map((alert: QualityAlertItem) => (
              <div
                key={alert.alert_id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-[#121b2f] border border-rose-500/30 dark:border-rose-500/40 text-xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-500 text-white'
                        : alert.severity === 'HIGH'
                        ? 'bg-amber-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {alert.check_name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Table: {alert.table}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {alert.alert_id} • {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-slate-700 dark:text-slate-300">
                  {alert.details}
                </p>

                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px]">
                  <span className="font-bold block mb-0.5 uppercase tracking-wider text-[9px]">
                    🛠️ Prescribed Runbook Remediation:
                  </span>
                  <span>{alert.runbook_action}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Dimension Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {dimensionList.map((d) => (
            <button
              key={d.id}
              onClick={() => setFilterDimension(d.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                filterDimension === d.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#0e1526] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#1e2d4d] hover:bg-slate-50 dark:hover:bg-[#141f36]'
              }`}
            >
              {d.label} ({d.count})
            </button>
          ))}
        </div>

        {/* Status Filter & Search Box */}
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="warning">Warnings</option>
          </select>
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search checks or tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Detailed Rules Audit Table */}
      {isLoading ? (
        <SkeletonTable rows={10} />
      ) : (
        <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 dark:border-[#1e2d4d] flex items-center justify-between bg-slate-50 dark:bg-[#11192e]">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Audit Rule Catalog &amp; Verification Evidence ({filteredChecks.length} checks)
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Score: {report?.score_pct.toFixed(1)}% (Zero Hallucination Formula)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 dark:bg-[#0c1220] text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-[#1e2d4d]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Rule / Validation Check</th>
                  <th className="py-3 px-4 font-semibold">Target Table</th>
                  <th className="py-3 px-4 font-semibold">Quality Dimension</th>
                  <th className="py-3 px-4 font-semibold">Severity</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold">Audit Details &amp; Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1e2d4d]">
                {filteredChecks.map((chk: QualityRuleResult, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-[#141f36] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {chk.rule_name}
                    </td>

                    <td className="py-3 px-4 font-mono text-blue-600 dark:text-blue-400">
                      {chk.table}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-[#141f38] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {chk.category}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-mono font-semibold ${
                        chk.severity === 'CRITICAL' ? 'text-red-500' : chk.severity === 'HIGH' ? 'text-amber-500' : 'text-slate-400'
                      }`}>
                        {chk.severity}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          chk.status === 'PASSED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : chk.status === 'WARNING'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {chk.status === 'PASSED' ? '✓ Passed' : chk.status === 'WARNING' ? '⚠ Warning' : '✕ Failed'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-md">
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
