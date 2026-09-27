import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatusCard } from './components/StatusCard';
import { LandingHero } from './components/LandingHero';
import { ArchitectureView } from './components/ArchitectureView';
import { DiagnosticsView } from './components/DiagnosticsView';
import { DataFoundationView } from './components/DataFoundationView';
import { UpcomingModuleView } from './components/UpcomingModuleView';
import { HealthState } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('overview');

  const [healthState, setHealthState] = useState<HealthState>({
    status: 'idle',
    endpointUrl: 'http://localhost:8000/health',
  });

  const checkHealth = useCallback(async () => {
    setHealthState((prev) => ({ ...prev, status: 'checking' }));
    const startTime = performance.now();

    try {
      // First try relative /api/health (proxied via Vite) or direct http://localhost:8000/health
      const endpoint = 'http://localhost:8000/health';
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ok') {
          setHealthState({
            status: 'healthy',
            message: 'Status 200 OK - Backend Operational',
            latencyMs,
            lastChecked: new Date().toLocaleTimeString(),
            endpointUrl: endpoint,
          });
          return;
        }
      }

      setHealthState({
        status: 'unreachable',
        message: `HTTP ${response.status}: Unexpected response payload`,
        latencyMs,
        lastChecked: new Date().toLocaleTimeString(),
        endpointUrl: endpoint,
      });
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - startTime);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setHealthState({
        status: 'unreachable',
        message: errorMessage,
        latencyMs,
        lastChecked: new Date().toLocaleTimeString(),
        endpointUrl: 'http://localhost:8000/health',
      });
    }
  }, []);

  // Poll health on initial load and setup interval
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // 30s background pulse
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <div className="app-container">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="main-content">
        <Header
          currentTab={currentTab}
          healthState={healthState}
          onRefreshHealth={checkHealth}
        />

        <main className="content-viewport">
          {currentTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <StatusCard healthState={healthState} onRefresh={checkHealth} />
              <LandingHero onExploreHealth={() => setCurrentTab('diagnostics')} />
              <ArchitectureView />
            </div>
          )}

          {currentTab === 'diagnostics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <StatusCard healthState={healthState} onRefresh={checkHealth} />
              <DiagnosticsView healthState={healthState} onRefreshHealth={checkHealth} />
            </div>
          )}

          {currentTab === 'data-foundation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <StatusCard healthState={healthState} onRefresh={checkHealth} />
              <DataFoundationView />
            </div>
          )}

          {currentTab !== 'overview' && currentTab !== 'diagnostics' && currentTab !== 'data-foundation' && (
            <UpcomingModuleView
              tabId={currentTab}
              onBackToOverview={() => setCurrentTab('overview')}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
