import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { CustomerProfileModal } from '../views/CustomerProfileModal';
import { SettingsView } from '../views/SettingsView';
import { ThemeProvider } from '../context/ThemeContext';
import { api } from '../services/api';
import { CustomerDetail } from '../types';

describe('EmptyState Component Tests', () => {
  it('renders title, description, and action button', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="No Customers Found"
        description="Try adjusting your filter criteria or search terms."
        actionLabel="Reset Filters"
        onAction={onAction}
      />
    );

    expect(screen.getByText('No Customers Found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filter criteria or search terms.')).toBeInTheDocument();

    const actionBtn = screen.getByRole('button', { name: /Reset Filters/i });
    expect(actionBtn).toBeInTheDocument();
    fireEvent.click(actionBtn);
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});

describe('Modal Component Tests', () => {
  it('renders modal when isOpen is true and calls onClose when closed', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal Title">
        <div>Modal Body Content</div>
      </Modal>
    );

    expect(screen.getByText('Test Modal Title')).toBeInTheDocument();
    expect(screen.getByText('Modal Body Content')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Hidden Modal">
        <div>Hidden Body</div>
      </Modal>
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('CustomerProfileModal Tests', () => {
  const mockCustomer: CustomerDetail = {
    customer_id: 'CUST-00001',
    first_name: 'John',
    last_name: 'Doe',
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    age: 34,
    gender: 'Male',
    country: 'United States',
    region: 'North America',
    city: 'New York',
    signup_date: '2024-01-15',
    acquisition_channel: 'Organic Search',
    plan_name: 'Enterprise',
    plan_tier: 'Enterprise',
    contract_type: 'annual',
    customer_status: 'active',
    is_churned: false,
    current_mrr: 499.0,
    current_arr: 5988.0,
    tenure_months: 18.5,
    lifetime_billed_revenue: 8982.0,
    total_invoices_count: 18,
    failed_transactions_count: 0,
    has_payment_delinquency: false,
    total_sessions: 142,
    total_session_minutes: 3420.5,
    avg_session_minutes: 24.1,
    total_logins: 110,
    distinct_features_used: 6,
    total_active_days: 95,
    is_engagement_declining: false,
    total_tickets_count: 2,
    high_urgency_tickets_count: 0,
    avg_resolution_hours: 4.5,
    avg_satisfaction_score: 4.8,
    has_support_friction: false,
    risk_tier: 'Low',
    churn_probability: 0.04,
    top_risk_factors: [{ feature: 'monthly_price', shap_value: 0.05 }],
    top_protective_factors: [{ feature: 'contract_type', shap_value: -0.25 }],
  };

  it('renders complete 360 customer profile modal when customerId is provided', async () => {
    vi.spyOn(api, 'getCustomer').mockResolvedValue(mockCustomer);
    vi.spyOn(api, 'getPrediction').mockResolvedValue({
      customer_id: 'CUST-00001',
      probability: 0.04,
      risk_level: 'Low',
      model_version: 'v1.0.0',
      top_risk_factors: [{ feature: 'monthly_price', shap_value: 0.05, description: 'Risk driver' }],
      top_protective_factors: [{ feature: 'contract_type', shap_value: -0.25, description: 'Protective driver' }],
    });

    render(
      <ThemeProvider>
        <CustomerProfileModal
          customerId="CUST-00001"
          onClose={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/john\.doe@example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/CUST-00001/)).toBeInTheDocument();
  });
});

describe('SettingsView Component Tests', () => {
  it('renders platform settings, appearance controls, and diagnostics', () => {
    render(
      <ThemeProvider>
        <SettingsView />
      </ThemeProvider>
    );

    expect(screen.getByText(/Platform Settings & Configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/Appearance & Color Theme/i)).toBeInTheDocument();
    expect(screen.getByText(/FastAPI Backend Connectivity/i)).toBeInTheDocument();
  });
});
