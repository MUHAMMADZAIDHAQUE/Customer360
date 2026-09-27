import React from 'react';
import {
  ShieldAlert,
  Users2,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Layers,
  CheckCircle,
} from 'lucide-react';

interface LandingHeroProps {
  onExploreHealth: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onExploreHealth }) => {
  return (
    <section style={styles.heroSection}>
      {/* Hero Header */}
      <div style={styles.topBadgeContainer}>
        <div style={styles.topBadge}>
          <span style={styles.badgePulse} />
          <span style={styles.badgeText}>Phase 0 Foundation Initialized</span>
        </div>
      </div>

      <div style={styles.headerBlock}>
        <h1 style={styles.mainTitle}>
          Customer<span style={styles.highlightText}>360</span>
        </h1>
        <p style={styles.subtitle}>AI-Powered Customer Intelligence &amp; Retention Platform</p>
        <p style={styles.tagline}>Understand customers. Predict churn. Protect revenue.</p>
      </div>

      <p style={styles.description}>
        An enterprise-grade customer analytics platform engineered to ingest high-volume telemetry,
        calculate customer lifetime value, detect churn velocity through explainable machine learning models,
        and empower retention teams through actionable intelligence and native AI analyst integration.
      </p>

      {/* Action buttons */}
      <div style={styles.actions}>
        <button onClick={onExploreHealth} style={styles.primaryBtn}>
          <span>Inspect FastAPI Health Endpoint</span>
          <ArrowRight size={16} />
        </button>
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          style={styles.secondaryBtn}
        >
          <span>FastAPI Swagger Spec</span>
        </a>
      </div>

      {/* Pillar Cards (Platform Pillars, not fake charts) */}
      <div style={styles.pillarsGrid}>
        {/* Pillar 1 */}
        <div style={styles.pillarCard}>
          <div style={{ ...styles.pillarIcon, color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.12)' }}>
            <Users2 size={22} />
          </div>
          <h3 style={styles.pillarTitle}>Customer 360 &amp; RFM</h3>
          <p style={styles.pillarText}>
            Unified customer profiles aggregating transaction history, engagement cadence, and multi-dimensional
            Recency-Frequency-Monetary segmentation.
          </p>
          <div style={styles.pillarFooter}>
            <span style={styles.techTag}>dbt</span>
            <span style={styles.techTag}>DuckDB</span>
            <span style={styles.techTag}>PostgreSQL</span>
          </div>
        </div>

        {/* Pillar 2 */}
        <div style={styles.pillarCard}>
          <div style={{ ...styles.pillarIcon, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.12)' }}>
            <TrendingDown size={22} />
          </div>
          <h3 style={styles.pillarTitle}>Predictive Churn Engine</h3>
          <p style={styles.pillarText}>
            Early warning churn classification leveraging XGBoost and scikit-learn with SHAP attribution to explain
            the exact behavioral drivers behind attrition risk.
          </p>
          <div style={styles.pillarFooter}>
            <span style={styles.techTag}>XGBoost</span>
            <span style={styles.techTag}>SHAP</span>
            <span style={styles.techTag}>Polars</span>
          </div>
        </div>

        {/* Pillar 3 */}
        <div style={styles.pillarCard}>
          <div style={{ ...styles.pillarIcon, color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
            <ShieldAlert size={22} />
          </div>
          <h3 style={styles.pillarTitle}>Revenue at Risk &amp; CLV</h3>
          <p style={styles.pillarText}>
            Dynamic customer lifetime value forecasting and financial revenue-at-risk exposure calculations to
            prioritize high-value account intervention.
          </p>
          <div style={styles.pillarFooter}>
            <span style={styles.techTag}>Pandas</span>
            <span style={styles.techTag}>FastAPI</span>
            <span style={styles.techTag}>Power BI</span>
          </div>
        </div>

        {/* Pillar 4 */}
        <div style={styles.pillarCard}>
          <div style={{ ...styles.pillarIcon, color: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.12)' }}>
            <Sparkles size={22} />
          </div>
          <h3 style={styles.pillarTitle}>AI Copilot &amp; Intelligence</h3>
          <p style={styles.pillarText}>
            Conversational natural language analytics interface allowing business users to query retention cohorts,
            segment shifts, and mitigation strategies.
          </p>
          <div style={styles.pillarFooter}>
            <span style={styles.techTag}>LLM Orchestration</span>
            <span style={styles.techTag}>React</span>
            <span style={styles.techTag}>TypeScript</span>
          </div>
        </div>
      </div>

      {/* Engineering Principles & Architecture Foundation */}
      <div style={styles.foundationCard}>
        <div style={styles.foundationHeader}>
          <div style={styles.foundationIcon}>
            <Layers size={20} />
          </div>
          <div>
            <h4 style={styles.foundationTitle}>Production Engineering Discipline</h4>
            <p style={styles.foundationSub}>
              Designed according to real-world data engineering and cloud software standards
            </p>
          </div>
        </div>

        <div style={styles.principlesGrid}>
          <div style={styles.principleItem}>
            <CheckCircle size={16} color="var(--status-success)" />
            <span>Strict separation of concerns across Data, ML, API, and Frontend</span>
          </div>
          <div style={styles.principleItem}>
            <CheckCircle size={16} color="var(--status-success)" />
            <span>Zero hardcoded credentials: fully driven by environment variables</span>
          </div>
          <div style={styles.principleItem}>
            <CheckCircle size={16} color="var(--status-success)" />
            <span>Containerized multi-service Docker &amp; Docker Compose topology</span>
          </div>
          <div style={styles.principleItem}>
            <CheckCircle size={16} color="var(--status-success)" />
            <span>Automated pytest suite and contract-validated health endpoints</span>
          </div>
        </div>
      </div>
    </section>
  );
};

const styles: Record<string, React.CSSProperties> = {
  heroSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  topBadgeContainer: {
    display: 'flex',
  },
  topBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-medium)',
    padding: '0.35rem 0.85rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  badgePulse: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--status-success)',
    boxShadow: '0 0 8px var(--status-success)',
  },
  badgeText: {
    letterSpacing: '0.02em',
  },
  headerBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  mainTitle: {
    fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    color: 'var(--text-primary)',
    lineHeight: 1.1,
  },
  highlightText: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: 'clamp(1.15rem, 2.5vw, 1.35rem)',
    fontWeight: 600,
    color: 'var(--text-primary)',
    opacity: 0.9,
  },
  tagline: {
    fontSize: '1rem',
    fontWeight: 500,
    color: 'var(--brand-primary)',
    letterSpacing: '0.01em',
  },
  description: {
    fontSize: '0.95rem',
    lineHeight: 1.65,
    color: 'var(--text-secondary)',
    maxWidth: '850px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    backgroundColor: 'var(--brand-primary)',
    color: '#ffffff',
    padding: '0.7rem 1.4rem',
    borderRadius: '9px',
    fontSize: '0.875rem',
    fontWeight: 600,
    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
    transition: 'background-color var(--transition-fast)',
  },
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-medium)',
    color: 'var(--text-primary)',
    padding: '0.7rem 1.3rem',
    borderRadius: '9px',
    fontSize: '0.875rem',
    fontWeight: 600,
    transition: 'all var(--transition-fast)',
  },
  pillarsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.25rem',
    marginTop: '0.5rem',
  },
  pillarCard: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '1.35rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all var(--transition-fast)',
  },
  pillarIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  pillarText: {
    fontSize: '0.825rem',
    lineHeight: 1.55,
    color: 'var(--text-secondary)',
    flex: 1,
  },
  pillarFooter: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.35rem',
    paddingTop: '0.5rem',
    borderTop: '1px solid var(--border-subtle)',
  },
  techTag: {
    fontSize: '0.6875rem',
    fontFamily: 'var(--font-mono)',
    padding: '0.15rem 0.45rem',
    borderRadius: '4px',
    backgroundColor: 'var(--bg-surface-elevated)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-subtle)',
  },
  foundationCard: {
    backgroundColor: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '1.25rem 1.5rem',
    marginTop: '0.5rem',
  },
  foundationHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  foundationIcon: {
    color: 'var(--brand-primary)',
  },
  foundationTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  foundationSub: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  principlesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '0.75rem',
  },
  principleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
};
