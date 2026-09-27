import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NavigationTab, HealthState } from './types';
import { api } from './services/api';

// Views
import { DashboardView } from './views/DashboardView';
import { CustomersView } from './views/CustomersView';
import { ChurnAnalysisView } from './views/ChurnAnalysisView';
import { SegmentsView } from './views/SegmentsView';
import { CohortsView } from './views/CohortsView';
import { RevenueView } from './views/RevenueView';
import { PredictionsView } from './views/PredictionsView';
import { AIAnalystView } from './views/AIAnalystView';
import { DataQualityView } from './views/DataQualityView';
import { SettingsView } from './views/SettingsView';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const [healthState, setHealthState] = useState<HealthState>({
    status: 'idle',
    endpointUrl: 'http://127.0.0.1:8000/health',
  });

  const checkHealth = useCallback(async () => {
    setHealthState((prev) => ({ ...prev, status: 'checking' }));
    const t0 = performance.now();
    try {
      const data = await api.getHealth();
      const t1 = performance.now();
      const latencyMs = Math.round(t1 - t0);

      if (data.status === 'ok') {
        setHealthState({
          status: 'healthy',
          message: 'Status 200 OK - Backend Analytical Engine Operational',
          database: data.database,
          modelLoaded: data.model_loaded,
          version: data.version,
          latencyMs,
          lastChecked: new Date().toLocaleTimeString(),
          endpointUrl: 'http://127.0.0.1:8000/health',
        });
      } else {
        setHealthState({
          status: 'unreachable',
          message: `Service status: ${data.status}`,
          latencyMs,
          lastChecked: new Date().toLocaleTimeString(),
          endpointUrl: 'http://127.0.0.1:8000/health',
        });
      }
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - t0);
      setHealthState({
        status: 'unreachable',
        message: err.message || 'FastAPI service unavailable',
        latencyMs,
        lastChecked: new Date().toLocaleTimeString(),
        endpointUrl: 'http://127.0.0.1:8000/health',
      });
    }
  }, []);

  // Poll health on mount and every 30s
  useEffect(() => {
    checkHealth();
    const timer = setInterval(checkHealth, 30000);
    return () => clearInterval(timer);
  }, [checkHealth]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Viewport (offset on desktop by sidebar width) */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          healthState={healthState}
          onRefreshHealth={checkHealth}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && <DashboardView />}
          {currentTab === 'customers' && <CustomersView />}
          {currentTab === 'churn-analysis' && <ChurnAnalysisView />}
          {currentTab === 'segments' && <SegmentsView />}
          {currentTab === 'cohorts' && <CohortsView />}
          {currentTab === 'revenue' && <RevenueView />}
          {currentTab === 'predictions' && <PredictionsView />}
          {currentTab === 'ai-analyst' && <AIAnalystView />}
          {currentTab === 'data-quality' && <DataQualityView />}
          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export default App;
