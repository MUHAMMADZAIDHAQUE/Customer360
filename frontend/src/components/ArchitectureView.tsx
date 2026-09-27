import React from 'react';
import { Database, Cpu, BrainCircuit, Globe, BarChart2, CheckCircle2, Circle } from 'lucide-react';

interface TechStackItem {
  layer: string;
  icon: React.ReactNode;
  technologies: string[];
  role: string;
  phase0Status: 'implemented' | 'scaffolded' | 'roadmap';
}

const STACK_LAYERS: TechStackItem[] = [
  {
    layer: 'Backend API & Serving',
    icon: <Cpu size={20} color="var(--brand-primary)" />,
    technologies: ['FastAPI', 'Pydantic v2', 'Uvicorn', 'HTTPX'],
    role: 'Exposes asynchronous REST APIs, health checks, and data contracts.',
    phase0Status: 'implemented',
  },
  {
    layer: 'Frontend Application',
    icon: <Globe size={20} color="var(--brand-accent)" />,
    technologies: ['React 18', 'TypeScript', 'Vite', 'Vanilla CSS Design System'],
    role: 'Responsive SaaS portal with dark/light themes and system status observability.',
    phase0Status: 'implemented',
  },
  {
    layer: 'Data Storage & Engine',
    icon: <Database size={20} color="#3b82f6" />,
    technologies: ['PostgreSQL 16', 'DuckDB', 'Parquet', 'Polars', 'Pandas'],
    role: 'Hybrid OLTP transactional ingest and OLAP vectorized analytics engine.',
    phase0Status: 'implemented',
  },
  {
    layer: 'Analytics Engineering',
    icon: <BarChart2 size={20} color="#f59e0b" />,
    technologies: ['dbt Core', 'SQL Models', 'Data Contracts', 'Schema Testing'],
    role: 'Transform raw events into curated dimensional models and RFM scoring.',
    phase0Status: 'scaffolded',
  },
  {
    layer: 'Machine Learning & Explainability',
    icon: <BrainCircuit size={20} color="#8b5cf6" />,
    technologies: ['scikit-learn', 'XGBoost', 'SHAP Values'],
    role: 'Supervised churn propensity classification with feature-level attribution.',
    phase0Status: 'roadmap',
  },
  {
    layer: 'Business Intelligence & Cloud',
    icon: <Cpu size={20} color="#10b981" />,
    technologies: ['Power BI', 'DAX', 'Docker Compose', 'GitHub Actions'],
    role: 'Executive dashboards, automated CI/CD workflows, and container topology.',
    phase0Status: 'scaffolded',
  },
];

export const ArchitectureView: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Target Technology Stack &amp; Architectural Topology</h3>
        <p style={styles.subtitle}>
          Standardized enterprise components organized by functional layer for Customer360
        </p>
      </div>

      <div style={styles.grid}>
        {STACK_LAYERS.map((item) => (
          <div key={item.layer} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.iconContainer}>{item.icon}</div>
              <div style={styles.layerInfo}>
                <h4 style={styles.layerTitle}>{item.layer}</h4>
                <div style={styles.statusBadge}>
                  {item.phase0Status === 'implemented' ? (
                    <span style={styles.badgeSuccess}>
                      <CheckCircle2 size={11} style={{ marginRight: 4 }} />
                      Phase 0 Implemented
                    </span>
                  ) : item.phase0Status === 'scaffolded' ? (
                    <span style={styles.badgeScaffold}>
                      <Circle size={9} style={{ marginRight: 4 }} />
                      Scaffolded
                    </span>
                  ) : (
                    <span style={styles.badgeRoadmap}>Upcoming Phase</span>
                  )}
                </div>
              </div>
            </div>

            <p style={styles.roleText}>{item.role}</p>

            <div style={styles.tagGroup}>
              {item.technologies.map((tech) => (
                <span key={tech} style={styles.techTag}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: '1rem',
  },
  header: {
    marginBottom: '1.25rem',
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.25rem',
  },
  card: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  iconContainer: {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerInfo: {
    flex: 1,
  },
  layerTitle: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  statusBadge: {
    marginTop: '0.15rem',
  },
  badgeSuccess: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'var(--status-success)',
    backgroundColor: 'var(--status-success-bg)',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
    border: '1px solid rgba(16, 185, 129, 0.25)',
  },
  badgeScaffold: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.65rem',
    fontWeight: 600,
    color: 'var(--brand-primary)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
    border: '1px solid rgba(59, 130, 246, 0.25)',
  },
  badgeRoadmap: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.65rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-surface-elevated)',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
    border: '1px solid var(--border-subtle)',
  },
  roleText: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    flex: 1,
  },
  tagGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.35rem',
    paddingTop: '0.5rem',
    borderTop: '1px solid var(--border-subtle)',
  },
  techTag: {
    fontSize: '0.7rem',
    fontFamily: 'var(--font-mono)',
    backgroundColor: 'var(--bg-surface-elevated)',
    color: 'var(--text-primary)',
    padding: '0.15rem 0.45rem',
    borderRadius: '4px',
    border: '1px solid var(--border-subtle)',
  },
};
