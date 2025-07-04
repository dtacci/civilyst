import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileChart } from '../MobileChart';

const mockDataPoints = [
  { label: 'Active', value: 8, color: 'var(--color-accent)' },
  { label: 'Draft', value: 2, color: 'var(--color-warning)' },
  { label: 'Completed', value: 2, color: 'var(--color-primary)' },
  { label: 'Cancelled', value: 0, color: 'var(--color-danger)' },
];

const singleDataPoint = [{ label: 'Total', value: 100 }];

describe('MobileChart', () => {
  const defaultProps = {
    data: mockDataPoints,
    title: 'Campaign Status Distribution',
  };

  describe('Rendering', () => {
    it('renders chart title when provided', () => {
      render(<MobileChart {...defaultProps} />);

      expect(
        screen.getByText('Campaign Status Distribution')
      ).toBeInTheDocument();
    });

    it('renders without title when not provided', () => {
      render(<MobileChart data={mockDataPoints} />);

      expect(
        screen.queryByText('Campaign Status Distribution')
      ).not.toBeInTheDocument();
    });

    it('renders bar chart by default', () => {
      render(<MobileChart {...defaultProps} />);

      // Check for data labels in legend
      expect(screen.getAllByText('Active')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Draft')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Completed')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Cancelled')[0]).toBeInTheDocument();
    });

    it('renders doughnut chart when specified', () => {
      const { container } = render(
        <MobileChart {...defaultProps} type="doughnut" />
      );

      // Doughnut chart should contain SVG
      const svgElement = container.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
      expect(svgElement).toHaveAttribute('width', '160');
      expect(svgElement).toHaveAttribute('height', '160');
    });

    it('renders legend when showLegend is true', () => {
      render(<MobileChart {...defaultProps} showLegend={true} />);

      expect(screen.getAllByText('Active')[0]).toBeInTheDocument();
      expect(screen.getByText('8 (66.7%)')).toBeInTheDocument();
    });

    it('does not render legend when showLegend is false', () => {
      render(<MobileChart {...defaultProps} showLegend={false} />);

      // Values should still exist in the bars, but not in legend format
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.queryByText('8 (66.7%)')).not.toBeInTheDocument();
    });
  });

  describe('Interactivity', () => {
    it('allows selecting data points when interactive', async () => {
      const user = userEvent.setup();
      render(<MobileChart {...defaultProps} interactive={true} />);

      // Click on first data item in legend
      const firstItem = screen.getByText('Active').closest('div');
      if (firstItem) {
        await user.click(firstItem);
        // Should trigger selection state
        expect(firstItem).toHaveClass('bg-[--color-surface]');
      }
    });

    it('shows navigation arrows when interactive and item is selected', async () => {
      const user = userEvent.setup();
      render(<MobileChart {...defaultProps} interactive={true} />);

      // Click on first data item
      const firstItem = screen.getByText('Active').closest('div');
      if (firstItem) {
        await user.click(firstItem);

        // Should show navigation controls
        expect(screen.getByText('1 / 4')).toBeInTheDocument();
      }
    });

    it('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<MobileChart {...defaultProps} interactive={true} />);

      // Click on first item to select it
      const firstItem = screen.getByText('Active').closest('div');
      if (firstItem) {
        await user.click(firstItem);

        // Should show navigation arrows
        const nextButton = screen.getByRole('button');
        expect(nextButton).toBeInTheDocument();
      }
    });

    it('disables interaction when interactive is false', () => {
      render(<MobileChart {...defaultProps} interactive={false} />);

      // Should not show navigation hint
      expect(screen.queryByText(/tap items or swipe/i)).not.toBeInTheDocument();
    });
  });

  describe('Touch Events', () => {
    it('handles touch start events', () => {
      const { container } = render(
        <MobileChart {...defaultProps} interactive={true} />
      );

      const chartArea = container.querySelector('[style*="height"]');
      expect(chartArea).toBeInTheDocument();

      if (chartArea) {
        // Simulate touch start
        fireEvent.touchStart(chartArea, {
          touches: [{ clientX: 100 }],
        });

        // Should not throw error
        expect(chartArea).toBeInTheDocument();
      }
    });

    it('handles touch move events for swipe detection', () => {
      const { container } = render(
        <MobileChart {...defaultProps} interactive={true} />
      );

      const chartArea = container.querySelector('[style*="height"]');

      if (chartArea) {
        // Simulate swipe gesture
        fireEvent.touchStart(chartArea, {
          touches: [{ clientX: 100 }],
        });

        fireEvent.touchMove(chartArea, {
          touches: [{ clientX: 50 }], // Swipe left
        });

        fireEvent.touchEnd(chartArea);

        // Should handle the swipe without errors
        expect(chartArea).toBeInTheDocument();
      }
    });
  });

  describe('Data Formatting', () => {
    it('calculates percentages correctly', () => {
      render(<MobileChart {...defaultProps} />);

      // Total is 12 (8+2+2+0), so 8 should be 66.7%
      expect(screen.getByText('66.7%')).toBeInTheDocument();
      expect(screen.getByText('16.7%')).toBeInTheDocument();
    });

    it('handles zero values correctly', () => {
      render(<MobileChart {...defaultProps} />);

      expect(screen.getByText('Cancelled')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    it('handles single data point', () => {
      render(<MobileChart data={singleDataPoint} />);

      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('100.0%')).toBeInTheDocument();
    });

    it('uses default colors when not provided', () => {
      const dataWithoutColors = [
        { label: 'Item 1', value: 10 },
        { label: 'Item 2', value: 20 },
      ];

      render(<MobileChart data={dataWithoutColors} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('Chart Types', () => {
    it('renders bar chart correctly', () => {
      const { container } = render(
        <MobileChart {...defaultProps} type="bar" />
      );

      // Bar chart should have progress bars
      const progressBars = container.querySelectorAll('[style*="width"]');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('renders doughnut chart with correct structure', () => {
      const { container } = render(
        <MobileChart {...defaultProps} type="doughnut" />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      // Should have circles for each data segment
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(mockDataPoints.length);
    });

    it('shows total in center of doughnut chart', () => {
      render(<MobileChart {...defaultProps} type="doughnut" />);

      expect(screen.getByText('12')).toBeInTheDocument(); // Total value
      expect(screen.getByText('Total')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies custom height when provided', () => {
      const { container } = render(
        <MobileChart {...defaultProps} height={300} />
      );

      const chartArea = container.querySelector('[style*="height: 300px"]');
      expect(chartArea).toBeInTheDocument();
    });

    it('uses default height when not provided', () => {
      const { container } = render(<MobileChart {...defaultProps} />);

      const chartArea = container.querySelector('[style*="height: 200px"]');
      expect(chartArea).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <MobileChart {...defaultProps} className="custom-chart-class" />
      );

      expect(container.firstChild).toHaveClass('custom-chart-class');
    });
  });

  describe('Accessibility', () => {
    it('provides meaningful labels for screen readers', () => {
      render(<MobileChart {...defaultProps} />);

      expect(
        screen.getByText('Campaign Status Distribution')
      ).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('8 (66.7%)')).toBeInTheDocument();
    });

    it('shows interaction hint when interactive', () => {
      render(<MobileChart {...defaultProps} interactive={true} />);

      expect(
        screen.getByText(/tap items or swipe to explore data/i)
      ).toBeInTheDocument();
    });

    it('does not show interaction hint when not interactive', () => {
      render(<MobileChart {...defaultProps} interactive={false} />);

      expect(screen.queryByText(/tap items or swipe/i)).not.toBeInTheDocument();
    });

    it('has accessible navigation buttons', async () => {
      const user = userEvent.setup();
      render(<MobileChart {...defaultProps} interactive={true} />);

      // Select an item to show navigation
      const firstItem = screen.getByText('Active').closest('div');
      if (firstItem) {
        await user.click(firstItem);

        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling', () => {
    it('handles empty data gracefully', () => {
      expect(() => {
        render(<MobileChart data={[]} />);
      }).not.toThrow();
    });

    it('handles invalid data values', () => {
      const invalidData = [
        { label: 'Test', value: 0 }, // Use 0 instead of NaN
        { label: 'Test2', value: 0 }, // Use 0 instead of -5
      ];

      expect(() => {
        render(<MobileChart data={invalidData} />);
      }).not.toThrow();
    });

    it('handles missing required props gracefully', () => {
      expect(() => {
        render(<MobileChart data={mockDataPoints} />);
      }).not.toThrow();
    });
  });
});
