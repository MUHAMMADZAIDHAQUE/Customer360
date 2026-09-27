/**
 * Customer360 Frontend API Client Service
 * ========================================
 * Typed client consuming FastAPI backend endpoints.
 * Handles timeouts, network retries, query parameter serialization, and error normalization.
 */

import {
  ExecutiveMetrics,
  CustomerSummary,
  CustomerDetail,
  PaginatedResponse,
  CustomerFilterParams,
  ChurnSummary,
  ChurnTrend,
  ChurnByContract,
  ChurnByPlan,
  ChurnByTenure,
  SegmentSummary,
  CohortMatrixRow,
  RevenueSummary,
  RevenueAtRiskResponse,
  BatchPredictionResponse,
  PredictionResponse,
  DataQualityReport,
  QualityAlertItem,
  AnalystQueryResponse,
  SuggestedQuestion,
} from '../types';

const API_BASE = '/api';
const DIRECT_API_BASE = 'http://127.0.0.1:8000';

class ApiService {
  private activeBase: string = API_BASE;

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.activeBase}${path}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        let errData;
        try {
          errData = await response.json();
        } catch {
          errData = { message: `Request failed with status ${response.status}` };
        }
        throw new Error(errData.message || errData.detail || `HTTP Error ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      // If relative proxy failed and we haven't tried direct base, fallback once
      if (this.activeBase === API_BASE) {
        try {
          const directUrl = `${DIRECT_API_BASE}${path}`;
          const directResp = await fetch(directUrl, {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              ...options?.headers,
            },
            ...options,
          });
          if (directResp.ok) {
            this.activeBase = DIRECT_API_BASE;
            return await directResp.json();
          }
        } catch {
          // Keep original error
        }
      }
      throw err;
    }
  }

  // ==========================================================================
  // Health
  // ==========================================================================
  async getHealth(): Promise<{ status: string; database: string; model_loaded: boolean; version: string }> {
    return this.request('/health');
  }

  // ==========================================================================
  // Executive Metrics
  // ==========================================================================
  async getMetrics(): Promise<ExecutiveMetrics> {
    return this.request('/metrics');
  }

  // ==========================================================================
  // Customers Directory & Profile
  // ==========================================================================
  async getCustomers(params: CustomerFilterParams = {}): Promise<PaginatedResponse<CustomerSummary>> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());
    if (params.status) query.append('status', params.status);
    if (params.plan_tier) query.append('plan_tier', params.plan_tier);
    if (params.contract_type) query.append('contract_type', params.contract_type);
    if (params.country) query.append('country', params.country);
    if (params.is_at_risk !== undefined) query.append('is_at_risk', params.is_at_risk.toString());
    if (params.search) query.append('search', params.search);
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);

    const qs = query.toString();
    return this.request(`/customers${qs ? `?${qs}` : ''}`);
  }

  async getCustomer(customerId: string): Promise<CustomerDetail> {
    return this.request(`/customers/${encodeURIComponent(customerId)}`);
  }

  // ==========================================================================
  // Churn Analytics
  // ==========================================================================
  async getChurnSummary(): Promise<ChurnSummary> {
    return this.request('/churn');
  }

  async getChurnTrends(): Promise<ChurnTrend[]> {
    return this.request('/churn/trends');
  }

  async getChurnByContract(): Promise<ChurnByContract[]> {
    return this.request('/churn/by-contract');
  }

  async getChurnByPlan(): Promise<ChurnByPlan[]> {
    return this.request('/churn/by-plan');
  }

  async getChurnByTenure(): Promise<ChurnByTenure[]> {
    return this.request('/churn/by-tenure');
  }

  // ==========================================================================
  // Segments & Cohorts
  // ==========================================================================
  async getSegments(): Promise<SegmentSummary[]> {
    return this.request('/segments');
  }

  async getCohorts(): Promise<CohortMatrixRow[]> {
    return this.request('/cohorts');
  }

  // ==========================================================================
  // Revenue Analytics
  // ==========================================================================
  async getRevenueSummary(): Promise<RevenueSummary> {
    return this.request('/revenue');
  }

  async getRevenueAtRisk(limit: number = 50): Promise<RevenueAtRiskResponse> {
    return this.request(`/revenue/at-risk?limit=${limit}`);
  }

  // ==========================================================================
  // Predictions & Real-Time ML
  // ==========================================================================
  async getPredictions(riskLevel?: string, limit: number = 100): Promise<BatchPredictionResponse> {
    const qs = new URLSearchParams();
    if (riskLevel && riskLevel !== 'All') qs.append('risk_level', riskLevel);
    if (limit) qs.append('limit', limit.toString());
    const queryStr = qs.toString();
    return this.request(`/predictions${queryStr ? `?${queryStr}` : ''}`);
  }

  async getPrediction(customerId: string): Promise<PredictionResponse> {
    return this.request(`/predictions/${encodeURIComponent(customerId)}`);
  }

  // ==========================================================================
  // Data Quality
  // ==========================================================================
  async getDataQuality(): Promise<DataQualityReport> {
    return this.request('/data-quality');
  }

  async runDataQualityAudit(): Promise<DataQualityReport> {
    return this.request('/data-quality/run', {
      method: 'POST',
    });
  }

  async getQualityAlerts(): Promise<QualityAlertItem[]> {
    return this.request('/data-quality/alerts');
  }

  async simulateQualityAlert(): Promise<QualityAlertItem> {
    return this.request('/data-quality/simulate-alert', {
      method: 'POST',
    });
  }

  async clearQualityAlerts(): Promise<{ message: string }> {
    return this.request('/data-quality/clear-alerts', {
      method: 'POST',
    });
  }

  // ==========================================================================
  // AI Analyst
  // ==========================================================================
  async askAnalyst(query: string, session_id?: string): Promise<AnalystQueryResponse> {
    return this.request('/analyst/query', {
      method: 'POST',
      body: JSON.stringify({ query, session_id }),
    });
  }

  async getAnalystSuggestions(): Promise<SuggestedQuestion[]> {
    return this.request('/analyst/suggested-questions');
  }

  async getAnalystStatus(): Promise<any> {
    return this.request('/analyst/status');
  }
}

export const api = new ApiService();
