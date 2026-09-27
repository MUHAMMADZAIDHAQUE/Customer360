import React, { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';
import { HealthState } from '../types';

interface DiagnosticsViewProps {
  healthState: HealthState;
  onRefreshHealth: () => void;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({ healthState, onRefreshHealth }) => {
  const [copied, setCopied] = useState(false);
  const [testPath, setTestPath] = useState('/health');
  const [customResponse, setCustomResponse] = useState<string | null>(null);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestEndpoint = async (endpoint: string) => {
    setIsLoadingCustom(true);
    setTestPath(endpoint);
    try {
      const res = await fetch(`http://localhost:8000${endpoint}`);
      const data = await res.json();
      setCustomResponse(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setCustomResponse(`// Failed to fetch http://localhost:8000${endpoint}\n// ${message}`);
    } finally {
      setIsLoadingCustom(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>FastAPI Backend Diagnostics &amp; Contract Verification</h3>
        <p style={styles.subtitle}>
          Interactive API verification tool testing local service endpoints against Phase 0 acceptance specifications.
        </p>
      </div>

      <div style={styles.interactiveCard}>
        <div style={styles.toolbar}>
          <div style={styles.endpointPicker}>
            <button
              onClick={() => {
                handleTestEndpoint('/health');
                onRefreshHealth();
              }}
              style={{
                ...styles.endpointBtn,
                ...(testPath === '/health' ? styles.endpointBtnActive : {}),
              }}
            >
              GET /health
            </button>
            <button
              onClick={() => handleTestEndpoint('/')}
              style={{
                ...styles.endpointBtn,
                ...(testPath === '/' ? styles.endpointBtnActive : {}),
              }}
            >
              GET / (Root Metadata)
            </button>
            <button
              onClick={() => handleTestEndpoint('/docs')}
              style={{
                ...styles.endpointBtn,
                ...(testPath === '/docs' ? styles.endpointBtnActive : {}),
              }}
            >
              GET /docs (Swagger UI)
            </button>
          </div>

          <div style={styles.toolbarActions}>
            <button
              onClick={() => copyToClipboard('curl -i http://localhost:8000/health')}
              style={styles.copyBtn}
              title="Copy curl command"
            >
              {copied ? <Check size={14} color="var(--status-success)" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>
        </div>

        {/* Live response block */}
        <div style={styles.responseContainer}>
          <div style={styles.responseHeader}>
            <span style={styles.headerLabel}>HTTP Response Payload</span>
            <span style={styles.headerUrl}>http://localhost:8000{testPath}</span>
          </div>
          <pre style={styles.responseCode}>
            {isLoadingCustom
              ? '// Dispatching HTTP GET request...'
              : customResponse || (healthState.status === 'healthy'
                  ? JSON.stringify({ status: 'ok' }, null, 2)
                  : `// Status: ${healthState.status}\n// Endpoint: http://localhost:8000/health\n// Start backend: ./venv/bin/uvicorn api.main:app --port 8000 --reload`)}
          </pre>
        </div>
      </div>

      {/* Backend CLI Quick Reference */}
      <div style={styles.cliCard}>
        <div style={styles.cliHeader}>
          <Terminal size={18} color="var(--brand-primary)" />
          <h4 style={styles.cliTitle}>Backend CLI Run Commands</h4>
        </div>
        <div style={styles.commandList}>
          <div style={styles.commandRow}>
            <span style={styles.commandDesc}>Run FastAPI with auto-reload:</span>
            <code style={styles.codeSnippet}>./venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload</code>
          </div>
          <div style={styles.commandRow}>
            <span style={styles.commandDesc}>Execute automated pytest suite:</span>
            <code style={styles.codeSnippet}>./venv/bin/pytest tests/ -v</code>
          </div>
          <div style={styles.commandRow}>
            <span style={styles.commandDesc}>Verify health endpoint via curl:</span>
            <code style={styles.codeSnippet}>curl -s http://localhost:8000/health</code>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  interactiveCard: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--bg-surface-elevated)',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  endpointPicker: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  endpointBtn: {
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    transition: 'all var(--transition-fast)',
  },
  endpointBtnActive: {
    color: 'var(--brand-primary)',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-medium)',
  },
  toolbarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  copyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    padding: '0.3rem 0.65rem',
    borderRadius: '6px',
  },
  responseContainer: {
    backgroundColor: 'var(--code-bg)',
  },
  responseHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 1rem',
    borderBottom: '1px solid var(--border-subtle)',
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
  },
  headerLabel: {
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  headerUrl: {
    fontFamily: 'var(--font-mono)',
  },
  responseCode: {
    padding: '1rem',
    fontSize: '0.825rem',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    margin: 0,
    lineHeight: 1.5,
  },
  cliCard: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '1.25rem',
  },
  cliHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  cliTitle: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  commandList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  commandRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  commandDesc: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  codeSnippet: {
    fontSize: '0.8rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
  },
};
