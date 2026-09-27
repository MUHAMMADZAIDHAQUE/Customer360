/**
 * Customer360 TypeScript Type Definitions
 * ========================================
 * Authoritative types matching the backend FastAPI schemas and UI view states.
 */

export type ThemeMode = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

export interface HealthState {
  status: 'idle' | 'checking' | 'healthy' | 'unreachable';
  message?: string;
  database?: string;
  modelLoaded?: boolean;
  version?: string;
  latencyMs?: number;
  lastChecked?: string;
  endpointUrl: string;
}

export type NavigationTab =
  | 'dashboard'
  | 'customers'
  | 'churn-analysis'
  | 'segments'
  | 'cohorts'
  | 'revenue'
  | 'predictions'
  | 'ai-analyst'
  | 'data-quality'
  | 'settings';

export interface NavItemConfig {
  id: NavigationTab;
  label: string;
  description: string;
  iconName: string;
  badge?: string;
}

// ============================================================================
// EXECUTIVE METRICS
// ============================================================================
export interface ExecutiveMetrics {
  total_customers: number;
  active_customers: number;
  churned_customers: number;
  churn_rate_pct: number;
  retention_rate_pct: number;
  active_mrr: number;
  active_arr: number;
  arpu: number;
  total_realized_revenue: number;
  total_revenue_at_risk: number;
  at_risk_accounts_count: number;
}

// ============================================================================
// CUSTOMERS
// ============================================================================
export interface CustomerSummary {
  customer_id: string;
  full_name: string;
  email: string;
  country: string;
  plan_name: string;
  plan_tier: string;
  contract_type: string;
  customer_status: string;
  is_churned: boolean;
  current_mrr: number;
  current_arr: number;
  tenure_months: number;
  total_sessions: number;
  avg_satisfaction_score: number;
  has_support_friction: boolean;
  is_engagement_declining: boolean;
  risk_tier?: string;
  churn_probability?: number;
}

export interface SHAPFactor {
  feature: string;
  shap_value: number;
  description?: string;
}

export interface CustomerDetail extends CustomerSummary {
  first_name?: string;
  last_name?: string;
  age?: number;
  gender?: string;
  region?: string;
  city?: string;
  signup_date?: string;
  acquisition_channel?: string;

  lifetime_billed_revenue: number;
  total_invoices_count: number;
  failed_transactions_count: number;
  has_payment_delinquency: boolean;

  total_session_minutes: number;
  avg_session_minutes: number;
  total_logins: number;
  distinct_features_used: number;
  total_active_days: number;

  total_tickets_count: number;
  high_urgency_tickets_count: number;
  avg_resolution_hours: number;

  churn_date?: string;
  churn_reason?: string;
  churn_type?: string;
  churn_feedback?: string;

  top_risk_factors?: (SHAPFactor | { feature: string; shap: number })[];
  top_protective_factors?: (SHAPFactor | { feature: string; shap: number })[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CustomerFilterParams {
  page?: number;
  page_size?: number;
  status?: string;
  plan_tier?: string;
  contract_type?: string;
  country?: string;
  is_at_risk?: boolean;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ============================================================================
// CHURN ANALYTICS
// ============================================================================
export interface ChurnReasonItem {
  reason: string;
  count: number;
  pct_of_churns: number;
}

export interface ChurnSummary {
  overall_churn_rate_pct: number;
  total_churned_count: number;
  active_retained_count: number;
  top_churn_reasons: ChurnReasonItem[];
}

export interface ChurnTrend {
  observation_month: string;
  active_customers: number;
  new_signups: number;
  churned_customers: number;
  monthly_churn_rate_pct: number;
  active_mrr: number;
}

export interface ChurnByContract {
  contract_type: string;
  total_customers: number;
  churned_count: number;
  churn_rate_pct: number;
  total_arr: number;
  avg_clv: number;
}

export interface ChurnByPlan {
  plan_tier: string;
  total_subscribers: number;
  churned_subscribers: number;
  churn_rate_pct: number;
  avg_mrr: number;
  total_arr: number;
}

export interface ChurnByTenure {
  tenure_bracket: string;
  total_customers: number;
  churned_count: number;
  churn_rate_pct: number;
  avg_mrr: number;
}

// ============================================================================
// SEGMENTS
// ============================================================================
export interface SegmentSummary {
  rfm_segment: string;
  customer_count: number;
  active_count: number;
  churned_count: number;
  churn_rate_pct: number;
  total_active_arr: number;
  avg_clv: number;
  retention_playbook: string;
}

// ============================================================================
// COHORTS
// ============================================================================
export interface CohortMatrixRow {
  cohort_month: string;
  cohort_size: number;
  retention_percentages: Record<string, number | null>;
}

// ============================================================================
// REVENUE
// ============================================================================
export interface RevenuePlanItem {
  plan_name: string;
  plan_tier: string;
  total_subscribers: number;
  active_subscribers: number;
  plan_mrr: number;
  plan_arr: number;
  arr_share_pct: number;
}

export interface RevenueSummary {
  total_mrr: number;
  total_arr: number;
  arpu: number;
  total_realized_clv: number;
  plan_breakdown: RevenuePlanItem[];
}

export interface AtRiskAccountItem {
  customer_id: string;
  full_name: string;
  country: string;
  plan_tier: string;
  contract_type: string;
  current_mrr: number;
  annual_arr_at_risk: number;
  avg_satisfaction_score: number;
  total_tickets_count: number;
  is_engagement_declining: boolean;
  has_support_friction: boolean;
  has_payment_delinquency: boolean;
  churn_probability?: number;
  risk_tier?: string;
}

export interface RevenueAtRiskResponse {
  total_arr_at_risk: number;
  at_risk_account_count: number;
  accounts: AtRiskAccountItem[];
}

// ============================================================================
// PREDICTIONS
// ============================================================================
export interface BatchPredictionItem {
  customer_id: string;
  probability: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  is_at_risk: boolean;
  primary_risk_factor: string;
  annual_arr_at_risk: number;
}

export interface BatchPredictionResponse {
  total_scored: number;
  model_version: string;
  high_or_critical_risk_count: number;
  total_arr_at_risk: number;
  items: BatchPredictionItem[];
}

export interface PredictionResponse {
  customer_id: string;
  probability: number;
  risk_level: string;
  model_version: string;
  top_risk_factors: SHAPFactor[];
  top_protective_factors?: SHAPFactor[];
}

// ============================================================================
// DATA QUALITY
// ============================================================================
export interface QualityRuleResult {
  rule_name: string;
  category: string;
  table: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  details: string;
  failed_count: number;
}

export interface DataQualityReport {
  status: 'PASSED' | 'FAILED' | 'WARNING';
  total_rules: number;
  passed_rules: number;
  failed_rules: number;
  score_pct: number;
  summary: string;
  checks: QualityRuleResult[];
}

// ============================================================================
// AI ANALYST
// ============================================================================
export interface SupportingMetric {
  name: string;
  value: string;
  raw_value?: number;
  benchmark?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondary_value?: number;
  category?: string;
}

export interface ChartData {
  chart_type: 'bar' | 'column' | 'donut' | 'line' | 'scatter' | string;
  title: string;
  x_label?: string;
  y_label?: string;
  data: ChartDataPoint[];
}

export interface TableData {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface AnalystQueryResponse {
  query: string;
  intent: string;
  answer: string;
  supporting_metrics: SupportingMetric[];
  relevant_segment_or_filter: string;
  data_timestamp: string;
  chart?: ChartData;
  table?: TableData;
  limitations?: string;
  sources: string[];
  is_model_interpretation: boolean;
  suggested_followups: string[];
}

export interface SuggestedQuestion {
  category: string;
  question: string;
  description: string;
}
