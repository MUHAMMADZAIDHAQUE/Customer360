import React from 'react';
import {
  LayoutDashboard,
  Users,
  Activity,
  GitFork,
  BrainCircuit,
  TrendingDown,
  DollarSign,
  Bot,
  BarChart4,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { NavSection } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Platform Foundation',
    items: [
      {
        id: 'overview',
        label: 'Platform Overview',
        description: 'System architecture, status & capabilities',
        phase: 'Phase 0',
        status: 'active',
        badge: 'LIVE',
      },
      {
        id: 'diagnostics',
        label: 'API & Health Check',
        description: 'Live FastAPI connection diagnostics',
        phase: 'Phase 0',
        status: 'active',
        badge: 'LIVE',
      },
    ],
  },
  {
    title: 'Analytics Engineering',
    items: [
      {
        id: 'customer-profiles',
        label: 'Customer 360 Profiles',
        description: 'Unified customer entity view',
        phase: 'Phase 1',
        status: 'upcoming',
        badge: 'PLANNED',
      },
      {
        id: 'rfm',
        label: 'RFM Segmentation',
        description: 'Recency, Frequency, Monetary scoring',
        phase: 'Phase 1',
        status: 'upcoming',
        badge: 'PLANNED',
      },
      {
        id: 'cohorts',
        label: 'Cohort Retention',
        description: 'Cohort decay curves & retention matrices',
        phase: 'Phase 1',
        status: 'upcoming',
        badge: 'PLANNED',
      },
    ],
  },
  {
    title: 'Predictive ML & AI',
    items: [
      {
        id: 'churn-engine',
        label: 'Churn Prediction',
        description: 'XGBoost churn probability scores',
        phase: 'Phase 2',
        status: 'upcoming',
        badge: 'PLANNED',
      },
      {
        id: 'clv-risk',
        label: 'CLV & Revenue at Risk',
        description: 'Financial exposure & lifetime value',
        phase: 'Phase 2',
        status: 'upcoming',
        badge: 'PLANNED',
      },
      {
        id: 'ai-analyst',
        label: 'AI Analyst',
        description: 'Natural language analytical assistant',
        phase: 'Phase 3',
        status: 'upcoming',
        badge: 'PLANNED',
      },
      {
        id: 'powerbi',
        label: 'Power BI Workspace',
        description: 'Executive semantic model & dashboards',
        phase: 'Phase 3',
        status: 'upcoming',
        badge: 'PLANNED',
      },
    ],
  },
];

const ICONS: Record<string, React.ReactNode> = {
  overview: <LayoutDashboard size={18} />,
  diagnostics: <Activity size={18} />,
  'customer-profiles': <Users size={18} />,
  rfm: <GitFork size={18} />,
  cohorts: <BarChart4 size={18} />,
  'churn-engine': <TrendingDown size={18} />,
  'clv-risk': <DollarSign size={18} />,
  'ai-analyst': <Bot size={18} />,
  powerbi: <BrainCircuit size={18} />,
};

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brandContainer}>
        <div style={styles.logoMark}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="m4.93 4.93 4.24 4.24" />
            <path d="m14.83 9.17 4.24-4.24" />
            <path d="m14.83 14.83 4.24 4.24" />
            <path d="m9.17 14.83-4.24 4.24" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </div>
        <div>
          <h1 style={styles.brandTitle}>Customer360</h1>
          <p style={styles.brandSubtitle}>Intelligence &amp; Retention</p>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav style={styles.nav}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} style={styles.sectionGroup}>
            <div style={styles.sectionTitle}>{section.title}</div>
            <div style={styles.itemList}>
              {section.items.map((item) => {
                const isActive = currentTab === item.id;
                const isAvailable = item.status === 'active';

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    style={{
                      ...styles.navButton,
                      ...(isActive ? styles.navButtonActive : {}),
                      ...(!isAvailable ? styles.navButtonDisabled : {}),
                    }}
                    title={!isAvailable ? `${item.label} (${item.phase} - Planned)` : item.label}
                  >
                    <span style={{
                      ...styles.navIcon,
                      color: isActive ? 'var(--brand-primary)' : 'inherit'
                    }}>
                      {ICONS[item.id] || <Activity size={18} />}
                    </span>
                    <span style={styles.navLabel}>{item.label}</span>
                    {item.badge && (
                      <span
                        style={{
                          ...styles.badge,
                          ...(item.status === 'active' ? styles.badgeActive : styles.badgeUpcoming),
                        }}
                      >
                        {item.status === 'active' ? (
                          <CheckCircle2 size={10} style={{ marginRight: 3 }} />
                        ) : (
                          <Lock size={9} style={{ marginRight: 3 }} />
                        )}
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer System Status */}
      <div style={styles.footer}>
        <div style={styles.footerCard}>
          <div style={styles.footerHeader}>
            <span style={styles.statusDot} />
            <span style={styles.phaseLabel}>Phase 0 Scaffolding</span>
          </div>
          <p style={styles.footerDesc}>
            Foundational architecture &amp; FastAPI health services active.
          </p>
        </div>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '280px',
    backgroundColor: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    minHeight: '100vh',
    padding: '1.5rem 1rem 1rem 1rem',
    transition: 'background-color var(--transition-base), border-color var(--transition-base)',
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    paddingBottom: '1.25rem',
    borderBottom: '1px solid var(--border-subtle)',
    marginBottom: '1.25rem',
  },
  logoMark: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },
  brandTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  brandSubtitle: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    flex: 1,
    overflowY: 'auto',
  },
  sectionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  sectionTitle: {
    fontSize: '0.6875rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    paddingLeft: '0.75rem',
    marginBottom: '0.375rem',
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '0.55rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textAlign: 'left',
    transition: 'all var(--transition-fast)',
  },
  navButtonActive: {
    backgroundColor: 'var(--bg-surface-active)',
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  navButtonDisabled: {
    opacity: 0.72,
  },
  navIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    marginRight: '0.65rem',
  },
  navLabel: {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  badge: {
    fontSize: '0.625rem',
    fontWeight: 700,
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
    display: 'inline-flex',
    alignItems: 'center',
    letterSpacing: '0.04em',
  },
  badgeActive: {
    backgroundColor: 'var(--status-success-bg)',
    color: 'var(--status-success)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
  },
  badgeUpcoming: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-subtle)',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: '1rem',
  },
  footerCard: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    padding: '0.75rem',
  },
  footerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    marginBottom: '0.25rem',
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: 'var(--status-success)',
    boxShadow: '0 0 6px var(--status-success)',
  },
  phaseLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  footerDesc: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.35,
  },
};
