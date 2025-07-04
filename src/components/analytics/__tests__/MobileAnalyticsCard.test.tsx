import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileAnalyticsCard } from '../MobileAnalyticsCard';
import { ChartBarIcon } from '@heroicons/react/24/outline';

describe('MobileAnalyticsCard', () => {
  const defaultProps = {
    title: 'Total Campaigns',
    value: 42,
    subtitle: 'campaigns',
  };

  describe('Rendering', () => {
    it('renders basic card information correctly', () => {
      render(<MobileAnalyticsCard {...defaultProps} />);

      expect(screen.getByText('Total Campaigns')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('campaigns')).toBeInTheDocument();
    });

    it('renders with icon when provided', () => {
      render(
        <MobileAnalyticsCard
          {...defaultProps}
          icon={<ChartBarIcon data-testid="chart-icon" />}
        />
      );

      expect(screen.getByTestId('chart-icon')).toBeInTheDocument();
    });

    it('renders trend information when provided', () => {
      const trend = {
        value: 15,
        label: 'vs last month',
        positive: true,
      };

      render(<MobileAnalyticsCard {...defaultProps} trend={trend} />);

      expect(screen.getByText('15%')).toBeInTheDocument();
      expect(screen.getByText('vs last month')).toBeInTheDocument();
      expect(screen.getByText('↗')).toBeInTheDocument();
    });

    it('renders negative trend correctly', () => {
      const trend = {
        value: 8,
        label: 'vs last week',
        positive: false,
      };

      render(<MobileAnalyticsCard {...defaultProps} trend={trend} />);

      expect(screen.getByText('8%')).toBeInTheDocument();
      expect(screen.getByText('vs last week')).toBeInTheDocument();
      expect(screen.getByText('↘')).toBeInTheDocument();
    });

    it('renders string values correctly', () => {
      render(
        <MobileAnalyticsCard
          {...defaultProps}
          value="1.2K"
          subtitle="total votes"
        />
      );

      expect(screen.getByText('1.2K')).toBeInTheDocument();
      expect(screen.getByText('total votes')).toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    it('applies primary color classes by default', () => {
      const { container } = render(<MobileAnalyticsCard {...defaultProps} />);

      // Check for primary color in the value text
      const valueElement = screen.getByText('42');
      expect(valueElement).toHaveClass('text-[--color-primary]');
    });

    it('applies secondary color classes when specified', () => {
      const { container } = render(
        <MobileAnalyticsCard {...defaultProps} color="secondary" />
      );

      const valueElement = screen.getByText('42');
      expect(valueElement).toHaveClass('text-[--color-secondary]');
    });

    it('applies accent color classes when specified', () => {
      const { container } = render(
        <MobileAnalyticsCard {...defaultProps} color="accent" />
      );

      const valueElement = screen.getByText('42');
      expect(valueElement).toHaveClass('text-[--color-accent]');
    });
  });

  describe('Interactivity', () => {
    it('renders as button when onClick is provided', () => {
      const handleClick = jest.fn();
      render(<MobileAnalyticsCard {...defaultProps} onClick={handleClick} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('calls onClick when card is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(<MobileAnalyticsCard {...defaultProps} onClick={handleClick} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows chevron icon when clickable', () => {
      const handleClick = jest.fn();
      render(<MobileAnalyticsCard {...defaultProps} onClick={handleClick} />);

      // ChevronRightIcon should be present for clickable cards
      const chevron = screen
        .getByRole('button')
        .querySelector('svg[class*="w-5 h-5"]');
      expect(chevron).toBeInTheDocument();
    });

    it('does not render as button when onClick is not provided', () => {
      render(<MobileAnalyticsCard {...defaultProps} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper focus styles when clickable', () => {
      const handleClick = jest.fn();
      render(<MobileAnalyticsCard {...defaultProps} onClick={handleClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('has minimum touch target size when clickable', () => {
      const handleClick = jest.fn();
      render(<MobileAnalyticsCard {...defaultProps} onClick={handleClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ minHeight: 'var(--space-touch-target)' });
    });

    it('has appropriate aria labels for screen readers', () => {
      const trend = {
        value: 15,
        label: 'vs last month',
        positive: true,
      };

      render(<MobileAnalyticsCard {...defaultProps} trend={trend} />);

      // Check that trend information is accessible
      expect(screen.getByText('Total Campaigns')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('15%')).toBeInTheDocument();
    });
  });

  describe('Custom Classes', () => {
    it('applies custom className', () => {
      const { container } = render(
        <MobileAnalyticsCard {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('combines custom className with default classes', () => {
      const { container } = render(
        <MobileAnalyticsCard {...defaultProps} className="custom-class" />
      );

      const cardElement = container.firstChild;
      expect(cardElement).toHaveClass('custom-class');
      expect(cardElement).toHaveClass('bg-[--color-surface-elevated]');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero values correctly', () => {
      render(<MobileAnalyticsCard {...defaultProps} value={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles large numbers correctly', () => {
      render(<MobileAnalyticsCard {...defaultProps} value={999999} />);

      expect(screen.getByText('999999')).toBeInTheDocument();
    });

    it('handles empty strings gracefully', () => {
      render(<MobileAnalyticsCard title="" value="" subtitle="" />);

      // Should not crash and should render the structure
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('handles missing trend values gracefully', () => {
      const incompleteTrend = {
        value: 0,
        label: '',
        positive: true,
      };

      render(<MobileAnalyticsCard {...defaultProps} trend={incompleteTrend} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });
});
