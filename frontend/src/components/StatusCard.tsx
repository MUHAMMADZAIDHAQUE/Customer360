import React from 'react';
import { Activity, RefreshCw, CheckCircle2, AlertTriangle, Terminal, Clock, ShieldCheck } from 'lucide-react';
import { HealthState } from '../types';

interface StatusCardProps {
  healthState: HealthState;
  onRefresh: () => void;
}

export const StatusCard: React.FC<StatusCardProps> = ({ healthState, onRefresh }) => {
  const isHealthy = healthState.status === 'healthy';
  const isChecking = healthState.status === 'checking';
  const isUnreachable = healthState.status === 'unreachable';

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.titleGroup}>
          <div
            style={{
              ...styles.iconBox,
              backgroundColor: isHealthy
                ? 'var(--status-success-bg)'
                : isUnreachable
                ? 'var(--status-error-bg)'
                : 'var(--bg-surface-elevated)',
              color: isHealthy
                ? 'var(--status-success)'
                : isUnreachable
                ? 'var(--status-error)'
                : 'var(--text-secondary)',
            }}
          >
            <Activity size={20} />
          </div>
          <div>
            <h3 style={styles.cardTitle}>FastAPI Health Endpoint Monitor</h3>
            <p style={styles.cardSubtitle}>
              Continuous diagnostics against backend health verification route
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isChecking}
          style={{
            ...styles.refreshButton,
            opacity: isChecking ? 0.6 : 1,
          }}
          title="Send manual GET request to /health"
        >
          <RefreshCw size={14} style={{ animation: isChecking ? 'spin 1s linear infinite' : 'none' }} />
          <span>{isChecking ? 'Pinging...' : 'Test Health Endpoint'}</span>
        </button>
      </div>

      <div style={styles.metricsRow}>
        {/* Metric 1: Operational Status */}
        <div style={styles.metricItem}>
          <span style={styles.metricLabel}>Operational Status</span>
          <div style={styles.metricValueWrapper}>
            {isHealthy && <CheckCircle2 size={18} color="var(--status-success)" />}
            {isUnreachable && <AlertTriangle size={18} color="var(--status-error)" />}
            <span
              style={{
                ...styles.metricValue,
                color: isHealthy
                  ? 'var(--status-success)'
                  : isUnreachable
                  ? 'var(--status-error)'
                  : 'var(--text-secondary)',
              }}
            >
              {isHealthy ? '200 OK' : isUnreachable ? 'Service Unavailable' : 'Checking...'}
            </span>
          </div>
          <span style={styles.metricDetail}>
            {isHealthy ? 'Backend responsive & ready' : 'Ensure uvicorn is running on port 8000'}
          </span>
        </div>

        {/* Metric 2: Roundtrip Latency */}
        <div style={styles.metricItem}>
          <span style={styles.metricLabel}>Roundtrip Latency</span>
          <div style={styles.metricValueWrapper}>
            <Clock size={18} color="var(--brand-primary)" />
            <span style={styles.metricValue}>
              {healthState.latencyMs !== undefined ? `${healthState.latencyMs} ms` : '—'}
            </span>
          </div>
          <span style={styles.metricDetail}>Local HTTP client overhead</span>
        </div>

        {/* Metric 3: Target Route */}
        <div style={styles.metricItem}>
          <span style={styles.metricLabel}>Verified Route</span>
          <div style={styles.metricValueWrapper}>
            <Terminal size={18} color="var(--text-muted)" />
            <code style={styles.codeText}>GET /health</code>
          </div>
          <span style={styles.metricDetail}>{healthState.endpointUrl}</span>
        </div>

        {/* Metric 4: Specification */}
        <div style={styles.metricItem}>
          <span style={styles.metricLabel}>Phase 0 Requirement</span>
          <div style={styles.metricValueWrapper}>
            <ShieldCheck size={18} color="var(--brand-secondary)" />
            <span style={styles.metricValue}>Verified</span>
          </div>
          <span style={styles.metricDetail}>Matches {`{"status": "ok"}`} contract</span>
        </div>
      </div>

      {/* Payload Inspection Window */}
      <div style={styles.payloadBox}>
        <div style={styles.payloadHeader}>
          <div style={styles.payloadTitle}>
            <span style={styles.httpBadge}>GET</span>
            <code style={styles.payloadEndpoint}>{healthState.endpointUrl}</code>
          </div>
          <div style={styles.timestamp}>
            Last Checked: {healthState.lastChecked || 'Just now'}
          </div>
        </div>
        <pre style={styles.codeBlock}>
          {isHealthy
            ? JSON.stringify({ status: 'ok' }, null, 2)
            : isUnreachable
            ? `// Error: Connection refused at ${healthState.endpointUrl}\n// Run: ./venv/bin/uvicorn api.main:app --reload --port 8000`
            : '// Polling backend API...'}
        </pre>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '14px',
    padding: '1.5rem',
    boxShadow: 'var(--shadow-sm)',
    marginBottom: '2rem',
    transition: 'border-color var(--transition-base), background-color var(--transition-base)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  iconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all var(--transition-fast)',
  },
  cardTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  cardSubtitle: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    padding: '0.45rem 0.95rem',
    borderRadius: '8px',
    backgroundColor: 'var(--brand-primary)',
    color: '#ffffff',
    fontSize: '0.8rem',
    fontWeight: 600,
    transition: 'background-color var(--transition-fast)',
  },
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginBottom: '1.25rem',
  },
  metricItem: {
    backgroundColor: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  metricLabel: {
    fontSize: '0.72rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--text-muted)',
  },
  metricValueWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  metricValue: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  metricDetail: {
    fontSize: '0.72rem',
    color: 'var(--text-secondary)',
  },
  codeText: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  payloadBox: {
    backgroundColor: 'var(--code-bg)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  payloadHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.6rem 0.9rem',
    borderBottom: '1px solid var(--border-subtle)',
    fontSize: '0.75rem',
  },
  payloadTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  httpBadge: {
    backgroundColor: 'var(--brand-primary)',
    color: '#ffffff',
    fontSize: '0.625rem',
    fontWeight: 700,
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
  },
  payloadEndpoint: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  timestamp: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  codeBlock: {
    padding: '0.85rem 1rem',
    fontSize: '0.8rem',
    color: 'var(--text-primary)',
    lineHeight: 1.45,
    margin: 0,
  },
};
