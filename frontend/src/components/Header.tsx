import React from 'react';
import { Sun, Moon, ExternalLink, Activity, Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { HealthState, NavigationTab } from '../types';

interface HeaderProps {
  currentTab: NavigationTab;
  healthState: HealthState;
  onRefreshHealth: () => void;
  onOpenMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  healthState,
  onRefreshHealth,
  onOpenMobileSidebar,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  const getPageTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Executive Intelligence Dashboard';
      case 'customers':
        return 'Customer Directory & 360° Profiles';
      case 'churn-analysis':
        return 'Churn Investigation & Attrition Analysis';
      case 'segments':
        return 'RFM Behavioral Segmentation & Playbooks';
      case 'cohorts':
        return 'Cohort Retention Matrix & Heatmap';
      case 'revenue':
        return 'Revenue Run-Rate & At-Risk Capital';
      case 'predictions':
        return 'Machine Learning Churn Predictions (SHAP)';
      case 'ai-analyst':
        return 'AI Customer Intelligence Analyst';
      case 'data-quality':
        return 'Data Quality & Schema Hygiene Scorecard';
      case 'settings':
        return 'Platform Settings & API Diagnostics';
      default:
        return 'Customer360 Intelligence';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#0a0f1d]/90 backdrop-blur-md border-b border-slate-200 dark:border-[#19243b] px-5 sm:px-8 flex items-center justify-between transition-colors">
      {/* Left: Mobile hamburger & View Title */}
      <div className="flex items-center gap-3">
        {onOpenMobileSidebar && (
          <button
            onClick={onOpenMobileSidebar}
            aria-label="Open sidebar menu"
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">
              Customer360
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              Understand customers. Predict churn. Protect revenue.
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
            {getPageTitle(currentTab)}
          </h1>
        </div>
      </div>

      {/* Right: Actions (Health Pulse, Theme Toggle, OpenAPI Docs) */}
      <div className="flex items-center gap-2.5">
        {/* Live Backend Pulse */}
        <button
          onClick={onRefreshHealth}
          title="Click to ping FastAPI /health endpoint"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            healthState.status === 'healthy'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : healthState.status === 'unreachable'
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}
        >
          <Activity className={`w-3.5 h-3.5 ${healthState.status === 'checking' ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {healthState.status === 'healthy' ? 'API Online' : healthState.status === 'unreachable' ? 'Offline' : 'Checking'}
          </span>
          {healthState.latencyMs && (
            <span className="font-mono text-[10px] opacity-80">({healthState.latencyMs}ms)</span>
          )}
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-[#1e2d4d] transition-colors"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* FastAPI Docs Link */}
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          title="Open FastAPI interactive Swagger documentation"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-[#1e2d4d] transition-colors"
        >
          <span>OpenAPI Docs</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>
    </header>
  );
};
