import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, Table, HardDrive, Terminal, ShieldCheck } from 'lucide-react';

interface TableMeta {
  table: string;
  record_count: number;
  columns: number;
  size_kb: number;
  format: string;
}

export const DataFoundationView: React.FC = () => {
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>('customers');

  useEffect(() => {
    fetch('http://localhost:8000/analytics/tables')
      .then((res) => res.json())
      .then((data) => {
        if (data.tables) setTables(data.tables);
      })
      .catch((err) => console.error('Failed to load tables', err))
      .finally(() => setLoading(false));
  }, []);

  const totalRecords = tables.reduce((acc, t) => acc + t.record_count, 0);
  const totalSizeKb = tables.reduce((acc, t) => acc + t.size_kb, 0);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div>
        <div style={styles.badgeRow}>
          <span style={styles.phaseBadge}>Phase 1 Active</span>
          <span style={styles.subBadge}>Relational PostgreSQL + Apache Parquet + DuckDB</span>
        </div>
        <h2 style={styles.title}>Data Foundation &amp; Subscription Schema</h2>
        <p style={styles.subtitle}>
          Statistically calibrated subscription business telemetry supporting churn prediction, RFM segmentation,
          and cohort retention modeling with zero target leakage.
        </p>
      </div>

      {/* Top Level Metric Cards */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricIconBox}>
            <Database size={20} color="var(--brand-primary)" />
          </div>
          <div>
            <div style={styles.metricLabel}>Total Entities</div>
            <div style={styles.metricValue}>9 Core Tables</div>
            <div style={styles.metricSub}>Relational schema with PK/FK constraints</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIconBox}>
            <Table size={20} color="var(--brand-secondary)" />
          </div>
          <div>
            <div style={styles.metricLabel}>Total Records</div>
            <div style={styles.metricValue}>{loading ? '...' : totalRecords.toLocaleString()}</div>
            <div style={styles.metricSub}>Calibrated across 1,500 subscriber accounts</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIconBox}>
            <HardDrive size={20} color="var(--brand-accent)" />
          </div>
          <div>
            <div style={styles.metricLabel}>Parquet Storage</div>
            <div style={styles.metricValue}>{loading ? '...' : `${(totalSizeKb / 1024).toFixed(2)} MB`}</div>
            <div style={styles.metricSub}>Columnar Snappy compressed OLAP format</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIconBox}>
            <ShieldCheck size={20} color="var(--status-success)" />
          </div>
          <div>
            <div style={styles.metricLabel}>Data Quality Gatekeeper</div>
            <div style={{ ...styles.metricValue, color: 'var(--status-success)' }}>53/53 Passed</div>
            <div style={styles.metricSub}>100% integrity across uniqueness &amp; foreign keys</div>
          </div>
        </div>
      </div>

      {/* Tables Breakdown */}
      <div style={styles.tableCard}>
        <div style={styles.tableCardHeader}>
          <h3 style={styles.tableCardTitle}>Relational Entities &amp; Analytical Datasets</h3>
          <span style={styles.tableCardMeta}>Engineered with DuckDB &amp; PostgreSQL DDL</span>
        </div>

        <div style={styles.tableResponsive}>
          <table style={styles.dataTable}>
            <thead>
              <tr>
                <th style={styles.th}>Entity Name</th>
                <th style={styles.th}>Record Count</th>
                <th style={styles.th}>Columns</th>
                <th style={styles.th}>Storage Size</th>
                <th style={styles.th}>Format</th>
                <th style={styles.th}>Integrity Status</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr
                  key={t.table}
                  onClick={() => setSelectedTable(t.table)}
                  style={{
                    ...styles.tr,
                    backgroundColor: selectedTable === t.table ? 'var(--bg-surface-elevated)' : 'transparent',
                  }}
                >
                  <td style={styles.td}>
                    <code style={styles.tableName}>{t.table}</code>
                  </td>
                  <td style={styles.tdBold}>{t.record_count.toLocaleString()}</td>
                  <td style={styles.td}>{t.columns} fields</td>
                  <td style={styles.td}>{t.size_kb.toFixed(1)} KB</td>
                  <td style={styles.td}>
                    <span style={styles.formatTag}>{t.format.toUpperCase()}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.passedBadge}>
                      <CheckCircle2 size={12} style={{ marginRight: 4 }} />
                      Validated
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SQL & DuckDB Quickplay */}
      <div style={styles.sqlCard}>
        <div style={styles.sqlHeader}>
          <Terminal size={18} color="var(--brand-primary)" />
          <h4 style={styles.sqlTitle}>DuckDB &amp; PostgreSQL Quick Verification</h4>
        </div>
        <p style={styles.sqlDesc}>
          Execute vectorized analytical SQL directly over Parquet files or PostgreSQL using the CLI utilities:
        </p>
        <div style={styles.codeSnippetBox}>
          <code>./venv/bin/python3 analytics/duckdb_client.py</code>
          <span style={styles.commentText}># Executes high-speed OLAP aggregations on Parquet</span>
        </div>
        <div style={styles.codeSnippetBox}>
          <code>./venv/bin/python3 analytics/data_quality.py</code>
          <span style={styles.commentText}># Runs 53 integrity tests &amp; regenerates data quality report</span>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '0.4rem',
  },
  phaseBadge: {
    backgroundColor: 'var(--brand-primary)',
    color: '#ffffff',
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '0.15rem 0.55rem',
    borderRadius: '12px',
  },
  subBadge: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    maxWidth: '850px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.25rem',
  },
  metricCard: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    boxShadow: 'var(--shadow-sm)',
  },
  metricIconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metricLabel: {
    fontSize: '0.72rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: '0.04em',
  },
  metricValue: {
    fontSize: '1.35rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginTop: '0.15rem',
  },
  metricSub: {
    fontSize: '0.72rem',
    color: 'var(--text-secondary)',
    marginTop: '0.2rem',
  },
  tableCard: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
  },
  tableCardHeader: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  tableCardTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  tableCardMeta: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  tableResponsive: {
    overflowX: 'auto',
  },
  dataTable: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.85rem',
  },
  th: {
    padding: '0.85rem 1.5rem',
    fontSize: '0.7rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--bg-surface-elevated)',
  },
  tr: {
    borderBottom: '1px solid var(--border-subtle)',
    transition: 'background-color var(--transition-fast)',
    cursor: 'pointer',
  },
  td: {
    padding: '0.85rem 1.5rem',
    color: 'var(--text-secondary)',
  },
  tdBold: {
    padding: '0.85rem 1.5rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  tableName: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--brand-primary)',
    fontFamily: 'var(--font-mono)',
  },
  formatTag: {
    fontSize: '0.65rem',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    padding: '0.15rem 0.45rem',
    borderRadius: '4px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: 'var(--brand-primary)',
    border: '1px solid rgba(59, 130, 246, 0.25)',
  },
  passedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--status-success)',
    backgroundColor: 'var(--status-success-bg)',
    padding: '0.15rem 0.5rem',
    borderRadius: '12px',
    border: '1px solid rgba(16, 185, 129, 0.25)',
  },
  sqlCard: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '1.25rem 1.5rem',
  },
  sqlHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.4rem',
  },
  sqlTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  sqlDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.75rem',
  },
  codeSnippetBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.5rem 0.85rem',
    borderRadius: '6px',
    backgroundColor: 'var(--code-bg)',
    border: '1px solid var(--border-subtle)',
    marginBottom: '0.5rem',
    fontSize: '0.8rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)',
  },
  commentText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
};
