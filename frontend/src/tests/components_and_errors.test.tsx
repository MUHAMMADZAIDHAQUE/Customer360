import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from '../components/common/ErrorState';
import { KPICard } from '../components/common/KPICard';
import { RiskBadge, StatusBadge } from '../components/common/Badge';

describe('ErrorState Component Tests', () => {
  it('renders custom error message and triggers retry on button click', () => {
    const onRetry = vi.fn();
    render(
      <ErrorState
        title="Custom Failure"
        message="Backend API Gateway Timeout 504"
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Custom Failure')).toBeInTheDocument();
    expect(screen.getByText('Backend API Gateway Timeout 504')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Retry Connection/i });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('KPICard Component Tests', () => {
  it('renders title, value, change indicator, and badge correctly', () => {
    render(
      <KPICard
        title="Monthly Recurring Revenue"
        value="$74,250"
        change="+8.4%"
        changeType="positive"
        badge="ARR Run-rate"
        badgeVariant="success"
      />
    );

    expect(screen.getByText('Monthly Recurring Revenue')).toBeInTheDocument();
    expect(screen.getByText('$74,250')).toBeInTheDocument();
    expect(screen.getByText(/\+8\.4%/)).toBeInTheDocument();
    expect(screen.getByText('ARR Run-rate')).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    const { container } = render(
      <KPICard
        title="Customer Lifetime Value"
        value="$1,820"
        isLoading={true}
      />
    );

    const skeletonEl = container.querySelector('.animate-pulse');
    expect(skeletonEl).toBeInTheDocument();
  });
});

describe('Badge Components Tests', () => {
  it('renders RiskBadge with appropriate severity level and probability', () => {
    const { rerender } = render(<RiskBadge level="CRITICAL" probability={0.88} />);
    expect(screen.getByText('Critical')).toBeInTheDocument();

    rerender(<RiskBadge level="LOW" probability={0.05} />);
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('renders StatusBadge for active and churned customer states', () => {
    const { rerender } = render(<StatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();

    rerender(<StatusBadge status="churned" />);
    expect(screen.getByText('Churned')).toBeInTheDocument();
  });
});
