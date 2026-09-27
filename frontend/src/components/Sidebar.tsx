import React from 'react';
import {
  LayoutDashboard,
  Users,
  TrendingDown,
  Layers,
  Calendar,
  DollarSign,
  BrainCircuit,
  Bot,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { NavigationTab } from '../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tabId: NavigationTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItemDef {
  id: NavigationTab;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

export const NAV_ITEMS: NavItemDef[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: 'churn-analysis',
    label: 'Churn Analysis',
    icon: <TrendingDown className="w-4 h-4" />,
  },
  {
    id: 'segments',
    label: 'Segments',
    icon: <Layers className="w-4 h-4" />,
  },
  {
    id: 'cohorts',
    label: 'Cohorts',
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    id: 'revenue',
    label: 'Revenue',
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    id: 'predictions',
    label: 'Predictions',
    icon: <BrainCircuit className="w-4 h-4" />,
    badge: 'ML',
    badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30',
  },
  {
    id: 'ai-analyst',
    label: 'AI Analyst',
    icon: <Bot className="w-4 h-4" />,
    badge: 'AI',
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',
  },
  {
    id: 'data-quality',
    label: 'Data Quality',
    icon: <ShieldCheck className="w-4 h-4" />,
    badge: '100%',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-4 h-4" />,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-[#0a0f1d] border-r border-slate-200 dark:border-[#19243b] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-[#19243b]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-sm">
                360
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  Customer360
                </span>
                <span className="block text-[9px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
                  Intelligence SaaS
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Navigation Items List */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Intelligence Modules
            </div>

            {NAV_ITEMS.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#121b2f] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeColor || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Tagline & System Status */}
        <div className="p-4 border-t border-slate-100 dark:border-[#19243b]">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">FastAPI Engine</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold font-mono text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PORT 8000
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
              Understand customers. Predict churn. Protect revenue.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
