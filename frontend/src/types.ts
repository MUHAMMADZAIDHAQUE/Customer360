export type ThemeMode = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

export interface HealthState {
  status: 'idle' | 'checking' | 'healthy' | 'unreachable';
  message?: string;
  latencyMs?: number;
  lastChecked?: string;
  endpointUrl: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface NavItem {
  id: string;
  label: string;
  description: string;
  phase: string;
  status: 'active' | 'upcoming';
  badge?: string;
}
