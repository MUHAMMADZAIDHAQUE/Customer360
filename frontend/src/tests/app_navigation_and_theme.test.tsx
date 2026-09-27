import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { ThemeProvider } from '../context/ThemeContext';
import { HealthState } from '../types';

describe('Sidebar Navigation Tests', () => {
  it('renders all 10 core navigation tabs', () => {
    const onSelect = vi.fn();
    const onCloseMobile = vi.fn();

    render(
      <Sidebar
        currentTab="dashboard"
        onSelectTab={onSelect}
        isOpenMobile={false}
        onCloseMobile={onCloseMobile}
      />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Churn Analysis')).toBeInTheDocument();
    expect(screen.getByText('Segments')).toBeInTheDocument();
    expect(screen.getByText('Cohorts')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Predictions')).toBeInTheDocument();
    expect(screen.getByText('AI Analyst')).toBeInTheDocument();
    expect(screen.getByText('Data Quality')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('triggers onSelectTab callback when a navigation item is clicked', () => {
    const onSelect = vi.fn();
    const onCloseMobile = vi.fn();

    render(
      <Sidebar
        currentTab="dashboard"
        onSelectTab={onSelect}
        isOpenMobile={true}
        onCloseMobile={onCloseMobile}
      />
    );

    const predictionsBtn = screen.getByText('Predictions');
    fireEvent.click(predictionsBtn);

    expect(onSelect).toHaveBeenCalledWith('predictions');
    expect(onCloseMobile).toHaveBeenCalled();
  });
});

describe('Header and Theme Toggle Tests', () => {
  const dummyHealth: HealthState = {
    status: 'healthy',
    endpointUrl: 'http://localhost:8000/health',
    latencyMs: 14,
  };

  it('renders header with title and toggles theme when button is clicked', () => {
    render(
      <ThemeProvider>
        <Header
          currentTab="revenue"
          healthState={dummyHealth}
          onRefreshHealth={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Revenue Run-Rate & At-Risk Capital')).toBeInTheDocument();
    expect(screen.getByText('API Online')).toBeInTheDocument();

    const themeBtn = screen.getByTitle(/Switch to (light|dark) mode/i);
    expect(themeBtn).toBeInTheDocument();

    // Trigger theme toggle
    fireEvent.click(themeBtn);
    expect(document.documentElement.classList.contains('light')).toBe(true);

    fireEvent.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
