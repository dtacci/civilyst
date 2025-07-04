'use client';

import { useState, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface MobileChartProps {
  data: DataPoint[];
  title?: string;
  type?: 'bar' | 'line' | 'doughnut';
  height?: number;
  showLegend?: boolean;
  interactive?: boolean;
  className?: string;
}

export function MobileChart({
  data,
  title,
  type = 'bar',
  height = 200,
  showLegend = true,
  interactive = true,
  className = '',
}: MobileChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const maxValue = Math.max(...data.map((d) => d.value));
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  // Default colors for data points
  const defaultColors = [
    'var(--color-primary)',
    'var(--color-secondary)',
    'var(--color-accent)',
    'var(--color-warning)',
    'var(--color-danger)',
  ];

  const enhancedData = data.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length],
    percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
  }));

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!interactive) return;
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!interactive || touchStart === null) return;

    const touchEnd = e.touches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (
        diff > 0 &&
        selectedIndex !== null &&
        selectedIndex < data.length - 1
      ) {
        setSelectedIndex(selectedIndex + 1);
      } else if (diff < 0 && selectedIndex !== null && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      }
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  // Bar Chart Component
  const BarChart = () => (
    <div className="space-y-[--space-md]">
      {enhancedData.map((item, index) => (
        <div
          key={index}
          className={`
            relative cursor-pointer transition-all duration-[--duration-normal]
            ${selectedIndex === index ? 'transform scale-105' : ''}
          `}
          onClick={() => interactive && setSelectedIndex(index)}
        >
          <div className="flex items-center justify-between mb-[--space-xs]">
            <span className="text-[--font-size-sm] font-medium text-[--color-text-primary]">
              {item.label}
            </span>
            <div className="flex items-center space-x-[--space-sm]">
              <span className="text-[--font-size-sm] font-bold text-[--color-text-primary]">
                {item.value}
              </span>
              <span className="text-[--font-size-xs] text-[--color-text-tertiary]">
                {item.percentage.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="relative h-[--space-lg] bg-[--color-surface] rounded-[--border-radius-sm] overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-[--border-radius-sm] transition-all duration-[--duration-slow] ease-[--ease-out]"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color,
                opacity: selectedIndex === index ? 1 : 0.8,
              }}
            />

            {/* Animated fill effect */}
            <div
              className="absolute left-0 top-0 h-full rounded-[--border-radius-sm] opacity-20 animate-pulse"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color,
                animationDelay: `${index * 100}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  // Doughnut Chart Component
  const DoughnutChart = () => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    let currentAngle = 0;

    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg width="160" height="160" viewBox="0 0 160 160">
            {enhancedData.map((item, index) => {
              const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -currentAngle * (circumference / 100);
              currentAngle += item.percentage;

              return (
                <circle
                  key={index}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="12"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className={`
                    transition-all duration-[--duration-slow] cursor-pointer
                    ${selectedIndex === index ? 'stroke-[16]' : ''}
                  `}
                  onClick={() => interactive && setSelectedIndex(index)}
                  style={{
                    transformOrigin: '80px 80px',
                    transform: 'rotate(-90deg)',
                  }}
                />
              );
            })}
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[--font-size-lg] font-bold text-[--color-text-primary]">
                {selectedIndex !== null
                  ? enhancedData[selectedIndex].value
                  : totalValue}
              </div>
              <div className="text-[--font-size-xs] text-[--color-text-tertiary]">
                {selectedIndex !== null
                  ? enhancedData[selectedIndex].label
                  : 'Total'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`bg-[--color-surface-elevated] rounded-[--border-radius-lg] p-[--space-lg] ${className}`}
    >
      {/* Title */}
      {title && (
        <div className="flex items-center justify-between mb-[--space-lg]">
          <h3 className="text-[--font-size-lg] font-bold text-[--color-text-primary]">
            {title}
          </h3>

          {/* Navigation arrows for touch interaction */}
          {interactive && selectedIndex !== null && (
            <div className="flex items-center space-x-[--space-sm]">
              <button
                onClick={() =>
                  selectedIndex > 0 && setSelectedIndex(selectedIndex - 1)
                }
                disabled={selectedIndex === 0}
                className="p-[--space-sm] rounded-[--border-radius-sm] bg-[--color-surface] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>

              <span className="text-[--font-size-sm] text-[--color-text-secondary]">
                {selectedIndex + 1} / {data.length}
              </span>

              <button
                onClick={() =>
                  selectedIndex < data.length - 1 &&
                  setSelectedIndex(selectedIndex + 1)
                }
                disabled={selectedIndex === data.length - 1}
                className="p-[--space-sm] rounded-[--border-radius-sm] bg-[--color-surface] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Chart Area */}
      <div
        ref={chartRef}
        className="relative"
        style={{ height: `${height}px` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {type === 'bar' && <BarChart />}
        {type === 'doughnut' && <DoughnutChart />}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-[--space-lg] space-y-[--space-sm]">
          {enhancedData.map((item, index) => (
            <div
              key={index}
              className={`
                flex items-center space-x-[--space-sm] cursor-pointer
                p-[--space-sm] rounded-[--border-radius-sm] transition-all duration-[--duration-fast]
                ${selectedIndex === index ? 'bg-[--color-surface]' : 'hover:bg-[--color-surface]'}
              `}
              onClick={() => interactive && setSelectedIndex(index)}
            >
              <div
                className="w-[--space-md] h-[--space-md] rounded-[--border-radius-sm] flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[--font-size-sm] font-medium text-[--color-text-primary] truncate">
                  {item.label}
                </div>
                <div className="text-[--font-size-xs] text-[--color-text-tertiary]">
                  {item.value} ({item.percentage.toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Touch hint */}
      {interactive && data.length > 1 && (
        <div className="mt-[--space-md] text-center">
          <span className="text-[--font-size-xs] text-[--color-text-tertiary]">
            Tap items or swipe to explore data
          </span>
        </div>
      )}
    </div>
  );
}
