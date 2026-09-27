import React from 'react';
import { Lock, ArrowLeft, ShieldCheck } from 'lucide-react';
import { NAV_SECTIONS } from './Sidebar';
import { NavItem } from '../types';

interface UpcomingModuleViewProps {
  tabId: string;
  onBackToOverview: () => void;
}

export const UpcomingModuleView: React.FC<UpcomingModuleViewProps> = ({ tabId, onBackToOverview }) => {
  // Find metadata from nav sections
  let currentItem: NavItem = {
    id: tabId,
    label: 'Platform Feature',
    description: 'Scheduled for future implementation phase.',
    phase: 'Planned Phase',
    status: 'upcoming',
    badge: 'PLANNED',
  };

  for (const section of NAV_SECTIONS) {
    const found = section.items.find((item) => item.id === tabId);
    if (found) {
      currentItem = found;
      break;
    }
  }

  return (
    <div style={styles.container}>
      <button onClick={onBackToOverview} style={styles.backBtn}>
        <ArrowLeft size={16} />
        <span>Back to Platform Overview</span>
      </button>

      <div style={styles.card}>
        <div style={styles.iconCircle}>
          <Lock size={32} color="var(--brand-primary)" />
        </div>

        <div style={styles.badgeRow}>
          <span style={styles.phaseBadge}>{currentItem.phase}</span>
          <span style={styles.statusBadge}>Architectural Blueprint Defined</span>
        </div>

        <h2 style={styles.title}>{currentItem.label}</h2>
        <p style={styles.desc}>{currentItem.description}</p>

        <div style={styles.blueprintNotice}>
          <div style={styles.noticeHeader}>
            <ShieldCheck size={18} color="var(--status-success)" />
            <span style={styles.noticeTitle}>Engineering Boundary Notice</span>
          </div>
          <p style={styles.noticeBody}>
            In accordance with Phase 0 acceptance specifications, future functional logic and mock data
            are intentionally not generated prematurely. The folder hierarchy, data pipelines, and API
            contracts are scaffolded to cleanly support this module in subsequent project phases.
          </p>
        </div>

        <div style={styles.actionRow}>
          <button onClick={onBackToOverview} style={styles.primaryBtn}>
            Return to Phase 0 Overview
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    maxWidth: '800px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.825rem',
    fontWeight: 600,
    color: 'var(--brand-primary)',
    alignSelf: 'flex-start',
  },
  card: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '16px',
    padding: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxShadow: 'var(--shadow-md)',
  },
  iconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    backgroundColor: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-medium)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.25rem',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  phaseBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    backgroundColor: 'var(--brand-primary)',
    color: '#ffffff',
    padding: '0.15rem 0.55rem',
    borderRadius: '12px',
  },
  statusBadge: {
    fontSize: '0.7rem',
    fontWeight: 600,
    backgroundColor: 'var(--bg-surface-elevated)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-subtle)',
    padding: '0.15rem 0.55rem',
    borderRadius: '12px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
  },
  desc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    maxWidth: '520px',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
  blueprintNotice: {
    backgroundColor: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
    textAlign: 'left',
    maxWidth: '560px',
    marginBottom: '1.5rem',
  },
  noticeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    marginBottom: '0.35rem',
  },
  noticeTitle: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  noticeBody: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  actionRow: {
    display: 'flex',
  },
  primaryBtn: {
    backgroundColor: 'var(--brand-primary)',
    color: '#ffffff',
    padding: '0.65rem 1.35rem',
    borderRadius: '8px',
    fontSize: '0.825rem',
    fontWeight: 600,
  },
};
