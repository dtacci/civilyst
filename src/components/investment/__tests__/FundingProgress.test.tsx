import React from 'react';
import { render, screen } from '@testing-library/react';
import { FundingProgress } from '../FundingProgress';

describe('FundingProgress', () => {
  const defaultProps = {
    fundingGoal: 10000,
    currentFunding: 7500,
    backerCount: 25,
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
  };

  it('renders funding progress correctly', () => {
    render(<FundingProgress {...defaultProps} />);

    // Check if the current funding is displayed
    expect(screen.getByText('$7,500 raised')).toBeInTheDocument();

    // Check if the percentage is displayed
    expect(screen.getByText('75.0%')).toBeInTheDocument();

    // Check if the goal is displayed
    expect(screen.getByText('of $10,000 goal')).toBeInTheDocument();

    // Check if backer count is displayed
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('shows fully funded message when goal is reached', () => {
    render(<FundingProgress {...defaultProps} currentFunding={10000} />);

    expect(screen.getByText('Fully Funded! 🎉')).toBeInTheDocument();
  });

  it('shows almost funded message when funding is above 75%', () => {
    render(<FundingProgress {...defaultProps} currentFunding={8000} />);

    expect(screen.getByText(/Almost there!/)).toBeInTheDocument();
    expect(screen.getByText(/80% funded/)).toBeInTheDocument();
  });

  it('shows ending soon message when deadline is near', () => {
    const nearDeadline = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days
    render(<FundingProgress {...defaultProps} deadline={nearDeadline} />);

    expect(screen.getByText(/Ending soon!/)).toBeInTheDocument();
    expect(screen.getByText(/Only 2 days left/)).toBeInTheDocument();
  });

  it('calculates average pledge correctly', () => {
    render(<FundingProgress {...defaultProps} />);

    // Average should be 7500 / 25 = 300
    expect(screen.getByText('$300')).toBeInTheDocument();
  });
});
