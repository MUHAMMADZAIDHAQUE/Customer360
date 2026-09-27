import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NavigationTab, HealthState } from './types';
import { api } from './services/api';

// Code-split dynamic views for high performance & minimal initial bundle footprint
const DashboardView = lazy(() => import('./views/DashboardView').then(m => ({ default: m.DashboardView })));
const CustomersView = lazy(() => import('./views/CustomersView').then(m => ({ default: m.CustomersView })));
const ChurnAnalysisView = lazy(() => import('./views/ChurnAnalysisView').then(m => ({ default: m.ChurnAnalysisView })));
const SegmentsView = lazy(() => import('./views/SegmentsView').then(m => ({ default: m.SegmentsView })));
const CohortsView = lazy(() => import('./views/CohortsView').then(m => ({ default: m.CohortsView })));
const RevenueView = lazy(() => import('./views/RevenueView').then(m => ({ default: m.RevenueView })));
const PredictionsView = lazy(() => import('./views/PredictionsView').then(m => ({ default: m.PredictionsView })));
const AIAnalystView = lazy(() => import('./views/AIAnalystView').then(m => ({ default: m.AIAnalystView })));
const DataQualityView = lazy(() => import('./views/DataQualityView').then(m => ({ default: m.DataQualityView })));
const SettingsView = lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));

const ViewLoadingFallback = () => (
  <div className="space-y-6 animate-pulse max-w-7xl mx-auto py-6">
    <div className="h-10 bg-slate-200 dark:bg-[#141f36] rounded-xl w-64"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-28 bg-slate-200 dark:bg-[#141f36] rounded-2xl"></div>
      ))}
    </div>
    <div className="h-80 bg-slate-200 dark:bg-[#141f36] rounded-2xl"></div>
  </div>
);

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const [healthState, setHealthState] = useState<HealthState>({
    status: 'idle',
    endpointUrl: api.getEndpointUrl('/health'),
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
          endpointUrl: api.getEndpointUrl('/health'),
        });
      } else {
        setHealthState({
          status: 'unreachable',
          message: `Service status: ${data.status}`,
          latencyMs,
          lastChecked: new Date().toLocaleTimeString(),
          endpointUrl: api.getEndpointUrl('/health'),
        });
      }
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - t0);
      setHealthState({
        status: 'unreachable',
        message: err.message || 'FastAPI service unavailable',
        latencyMs,
        lastChecked: new Date().toLocaleTimeString(),
        endpointUrl: api.getEndpointUrl('/health'),
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

        {/* View Content with Suspense Lazy Loading */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Suspense fallback={<ViewLoadingFallback />}>
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
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default App;
