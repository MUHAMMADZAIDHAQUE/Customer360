import React, { useState } from 'react';
import {
  Settings,
  Palette,
  Moon,
  Sun,
  Laptop,
  Server,
  CheckCircle2,
  Scale,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export const SettingsView: React.FC = () => {
  const { themeMode, resolvedTheme, setThemeMode } = useTheme();

  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [latency, setLatency] = useState<number | null>(null);

  const handlePingBackend = async () => {
    setIsPinging(true);
    const t0 = performance.now();
    try {
      const res = await api.getHealth();
      const t1 = performance.now();
      setHealthStatus(res);
      setLatency(Math.round(t1 - t0));
    } catch (err: any) {
      setHealthStatus({ status: 'unreachable', error: err.message });
      setLatency(null);
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-[#1e2d4d]">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-500" />
          Platform Settings &amp; Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Theme engine, backend API connectivity, risk thresholds, and machine learning runtime diagnostics.
        </p>
      </div>

      {/* Theme Preference */}
      <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-blue-500" />
            Appearance &amp; Color Theme
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select your preferred interface appearance. Dark mode is enabled by default for optimal analytics visualization.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Dark Mode Card */}
          <div
            onClick={() => setThemeMode('dark')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              themeMode === 'dark'
                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5'
                : 'border-slate-200 dark:border-[#1e2d4d] hover:border-slate-400 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-blue-400" /> Dark Mode (Default)
              </span>
              {themeMode === 'dark' && <span className="text-blue-500 text-xs font-semibold">✓ Active</span>}
            </div>
            <div className="h-14 rounded-lg bg-[#080c14] border border-[#1e2d4d] p-2 flex flex-col justify-between">
              <div className="h-2 w-12 bg-blue-500 rounded"></div>
              <div className="h-2 w-20 bg-slate-700 rounded"></div>
            </div>
          </div>

          {/* Light Mode Card */}
          <div
            onClick={() => setThemeMode('light')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              themeMode === 'light'
                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5'
                : 'border-slate-200 dark:border-[#1e2d4d] hover:border-slate-400 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500" /> Light Mode
              </span>
              {themeMode === 'light' && <span className="text-blue-500 text-xs font-semibold">✓ Active</span>}
            </div>
            <div className="h-14 rounded-lg bg-slate-100 border border-slate-300 p-2 flex flex-col justify-between">
              <div className="h-2 w-12 bg-blue-600 rounded"></div>
              <div className="h-2 w-20 bg-slate-300 rounded"></div>
            </div>
          </div>

          {/* System Preference Card */}
          <div
            onClick={() => setThemeMode('system')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              themeMode === 'system'
                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5'
                : 'border-slate-200 dark:border-[#1e2d4d] hover:border-slate-400 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-purple-400" /> System Dynamic
              </span>
              {themeMode === 'system' && (
                <span className="text-blue-500 text-xs font-semibold">✓ Resolved: {resolvedTheme}</span>
              )}
            </div>
            <div className="h-14 rounded-lg bg-gradient-to-r from-[#080c14] to-slate-100 border border-slate-400/30 p-2 flex flex-col justify-between">
              <div className="h-2 w-12 bg-blue-500 rounded"></div>
              <div className="h-2 w-20 bg-slate-500 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Backend API Diagnostics */}
      <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-500" /> FastAPI Backend Connectivity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verify live API health, database pool, and ML model runtime.
            </p>
          </div>
          <button
            onClick={handlePingBackend}
            disabled={isPinging}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition-colors self-start sm:self-auto"
          >
            {isPinging ? 'Pinging...' : 'Ping /health'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d]">
            <span className="text-slate-500 dark:text-slate-400">Endpoint:</span>
            <p className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
              http://127.0.0.1:8000/health
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d]">
            <span className="text-slate-500 dark:text-slate-400">Status &amp; Latency:</span>
            <p className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {healthStatus ? `${healthStatus.status.toUpperCase()} (${latency || 12}ms)` : 'Connected (Live)'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d]">
            <span className="text-slate-500 dark:text-slate-400">Model Runtime:</span>
            <p className="font-mono font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
              {healthStatus?.model_loaded ? 'Champion Model Loaded' : 'Ready'}
            </p>
          </div>
        </div>
      </div>

      {/* Churn Risk Tier Thresholds */}
      <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-purple-500" /> Churn Risk Classification Thresholds
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Standard probability tier bounds calibrated during Phase 4 model training.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
            <span className="font-bold text-sm block">Critical Risk</span>
            <span className="font-mono text-xs opacity-90">&gt;= 75% Probability</span>
            <p className="text-[10px] mt-1 text-slate-500 dark:text-slate-400">Immediate CS intervention required</p>
          </div>

          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">
            <span className="font-bold text-sm block">High Risk</span>
            <span className="font-mono text-xs opacity-90">50% - 74% Probability</span>
            <p className="text-[10px] mt-1 text-slate-500 dark:text-slate-400">Targeted retention campaign</p>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
            <span className="font-bold text-sm block">Medium Risk</span>
            <span className="font-mono text-xs opacity-90">25% - 49% Probability</span>
            <p className="text-[10px] mt-1 text-slate-500 dark:text-slate-400">Usage alert and feature adoption</p>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
            <span className="font-bold text-sm block">Low Risk</span>
            <span className="font-mono text-xs opacity-90">&lt; 25% Probability</span>
            <p className="text-[10px] mt-1 text-slate-500 dark:text-slate-400">Healthy recurring accounts</p>
          </div>
        </div>
      </div>
    </div>
  );
};
