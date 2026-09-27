import React from 'react';
import { Sun, Moon, Laptop, ExternalLink, Activity } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { HealthState } from '../types';

interface HeaderProps {
  currentTab: string;
  healthState: HealthState;
  onRefreshHealth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, healthState, onRefreshHealth }) => {
  const { themeMode, resolvedTheme, setThemeMode } = useTheme();

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'overview':
        return 'Customer Intelligence Platform Overview';
      case 'diagnostics':
        return 'API Health & System Diagnostics';
      default:
        return 'Customer360 Intelligence';
    }
  };

  return (
    <header style={styles.header}>
      {/* Left side: breadcrumb / title */}
      <div>
        <div style={styles.platformBadge}>
          <span style={styles.platformBadgeDot} />
          Customer360 Engine v0.1.0 • Phase 0 Scaffolding
        </div>
        <h2 style={styles.pageTitle}>{getPageTitle(currentTab)}</h2>
      </div>

      {/* Right side: Health status pill, Theme Selector, API Docs */}
      <div style={styles.actionsGroup}>
        {/* Backend Live Indicator */}
        <button
          onClick={onRefreshHealth}
          title="Click to re-check FastAPI /health endpoint"
          style={{
            ...styles.statusButton,
            ...(healthState.status === 'healthy' ? styles.statusButtonHealthy : {}),
            ...(healthState.status === 'unreachable' ? styles.statusButtonError : {}),
          }}
        >
          <Activity
            size={14}
            className={healthState.status === 'checking' ? 'spin' : ''}
            style={{
              color:
                healthState.status === 'healthy'
                  ? 'var(--status-success)'
                  : healthState.status === 'unreachable'
                  ? 'var(--status-error)'
                  : 'var(--text-muted)',
            }}
          />
          <span style={styles.statusButtonText}>
            Backend: {healthState.status === 'healthy' ? 'Online' : healthState.status === 'checking' ? 'Pinging...' : 'Offline'}
          </span>
          {healthState.latencyMs !== undefined && (
            <span style={styles.latencyBadge}>{healthState.latencyMs}ms</span>
          )}
        </button>

        {/* API Docs Link */}
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          style={styles.docsLink}
          title="Open FastAPI Swagger Interactive Documentation"
        >
          <span>API Docs</span>
          <ExternalLink size={13} />
        </a>

        {/* Theme Segmented Switcher (Dark, Light, System) */}
        <div style={styles.themeSelector} role="radiogroup" aria-label="Theme selection">
          <button
            type="button"
            onClick={() => setThemeMode('dark')}
            title="Dark theme (Default)"
            aria-checked={themeMode === 'dark'}
            role="radio"
            style={{
              ...styles.themeButton,
              ...(themeMode === 'dark' ? styles.themeButtonActive : {}),
            }}
          >
            <Moon size={14} />
            <span style={styles.themeLabel}>Dark</span>
          </button>

          <button
            type="button"
            onClick={() => setThemeMode('light')}
            title="Light theme"
            aria-checked={themeMode === 'light'}
            role="radio"
            style={{
              ...styles.themeButton,
              ...(themeMode === 'light' ? styles.themeButtonActive : {}),
            }}
          >
            <Sun size={14} />
            <span style={styles.themeLabel}>Light</span>
          </button>

          <button
            type="button"
            onClick={() => setThemeMode('system')}
            title={`System preference (currently ${resolvedTheme})`}
            aria-checked={themeMode === 'system'}
            role="radio"
            style={{
              ...styles.themeButton,
              ...(themeMode === 'system' ? styles.themeButtonActive : {}),
            }}
          >
            <Laptop size={14} />
            <span style={styles.themeLabel}>Auto</span>
          </button>
        </div>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: '72px',
    backgroundColor: 'var(--bg-header)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2.5rem',
    position: 'sticky',
    top: 0,
    zIndex: 20,
    transition: 'background-color var(--transition-base), border-color var(--transition-base)',
  },
  platformBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    letterSpacing: '0.02em',
    marginBottom: '0.15rem',
  },
  platformBadgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--brand-primary)',
  },
  pageTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.015em',
  },
  actionsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  statusButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    padding: '0.35rem 0.75rem',
    borderRadius: '20px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    transition: 'all var(--transition-fast)',
  },
  statusButtonHealthy: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'var(--status-success-bg)',
    color: 'var(--status-success)',
  },
  statusButtonError: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'var(--status-error-bg)',
    color: 'var(--status-error)',
  },
  statusButtonText: {
    fontWeight: 600,
  },
  latencyBadge: {
    fontSize: '0.65rem',
    fontFamily: 'var(--font-mono)',
    padding: '0.1rem 0.35rem',
    borderRadius: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  docsLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.35rem 0.75rem',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    transition: 'all var(--transition-fast)',
  },
  themeSelector: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    padding: '2px',
    gap: '2px',
  },
  themeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.3rem 0.55rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--text-muted)',
    transition: 'all var(--transition-fast)',
  },
  themeButtonActive: {
    backgroundColor: 'var(--bg-surface-elevated)',
    color: 'var(--text-primary)',
    fontWeight: 600,
    boxShadow: 'var(--shadow-sm)',
  },
  themeLabel: {
    fontSize: '0.7rem',
  },
};
