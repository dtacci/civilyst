'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';

interface TimeSlot {
  start: string; // "09:00"
  end: string; // "17:00"
}

interface AvailabilityDay {
  date: string; // "2024-01-15"
  isAvailable: boolean;
  timeSlots: TimeSlot[];
  notes?: string;
}

interface AvailabilityCalendarProps {
  availability: AvailabilityDay[];
  onAvailabilityChange: (availability: AvailabilityDay[]) => void;
  maxSelections?: number;
  startDate?: Date;
  className?: string;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { start: '09:00', end: '12:00' },
  { start: '13:00', end: '17:00' },
];

export function AvailabilityCalendar({
  availability,
  onAvailabilityChange,
  maxSelections = 10,
  startDate = new Date(),
  className,
}: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(startDate);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Generate calendar days
  const generateCalendarDays = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentDate]);

  const calendarDays = generateCalendarDays();

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getAvailabilityForDate = (
    date: string
  ): AvailabilityDay | undefined => {
    return availability.find((av) => av.date === date);
  };

  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (date: Date) => {
    if (isPastDate(date)) return;

    const dateStr = formatDate(date);
    const existing = getAvailabilityForDate(dateStr);

    if (existing) {
      setSelectedDate(dateStr);
    } else {
      // Add new availability
      if (availability.filter((av) => av.isAvailable).length >= maxSelections) {
        return; // Max selections reached
      }

      const newAvailability: AvailabilityDay = {
        date: dateStr,
        isAvailable: true,
        timeSlots: [...DEFAULT_TIME_SLOTS],
      };

      onAvailabilityChange([...availability, newAvailability]);
      setSelectedDate(dateStr);
    }
  };

  const handleToggleAvailability = (date: string) => {
    const updated = availability.map((av) =>
      av.date === date ? { ...av, isAvailable: !av.isAvailable } : av
    );
    onAvailabilityChange(updated);
  };

  const handleRemoveAvailability = (date: string) => {
    const updated = availability.filter((av) => av.date !== date);
    onAvailabilityChange(updated);
    if (selectedDate === date) {
      setSelectedDate(null);
    }
  };

  const handleTimeSlotChange = (
    date: string,
    index: number,
    field: 'start' | 'end',
    value: string
  ) => {
    const updated = availability.map((av) => {
      if (av.date !== date) return av;

      const newTimeSlots = [...av.timeSlots];
      newTimeSlots[index] = { ...newTimeSlots[index], [field]: value };

      return { ...av, timeSlots: newTimeSlots };
    });

    onAvailabilityChange(updated);
  };

  const handleAddTimeSlot = (date: string) => {
    const updated = availability.map((av) => {
      if (av.date !== date) return av;

      return {
        ...av,
        timeSlots: [...av.timeSlots, { start: '09:00', end: '17:00' }],
      };
    });

    onAvailabilityChange(updated);
  };

  const handleRemoveTimeSlot = (date: string, index: number) => {
    const updated = availability.map((av) => {
      if (av.date !== date) return av;

      return {
        ...av,
        timeSlots: av.timeSlots.filter((_, i) => i !== index),
      };
    });

    onAvailabilityChange(updated);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const selectedAvailability = selectedDate
    ? getAvailabilityForDate(selectedDate)
    : null;

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('prev')}
        >
          ←
        </Button>
        <h2 className="text-lg font-semibold">
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('next')}
        >
          →
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* Day headers */}
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-[--color-text-secondary] p-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={index} className="p-2" />;
          }

          const dateStr = formatDate(date);
          const availabilityData = getAvailabilityForDate(dateStr);
          const isPast = isPastDate(date);
          const isSelected = selectedDate === dateStr;
          const isAvailable = availabilityData?.isAvailable;

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={isPast}
              className={cn(
                'aspect-square p-1 text-sm rounded-[--border-radius-sm] transition-colors',
                'hover:bg-[--color-surface-hover] focus:outline-none focus:ring-2 focus:ring-[--color-primary]',
                isPast && 'opacity-50 cursor-not-allowed',
                isSelected && 'ring-2 ring-[--color-primary]',
                isAvailable && 'bg-green-100 text-green-800',
                availabilityData && !isAvailable && 'bg-gray-100 text-gray-600'
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Availability Status */}
      <div className="mb-4">
        <div className="text-sm font-medium text-[--color-text-primary] mb-2">
          Available Days ({availability.filter((av) => av.isAvailable).length}/
          {maxSelections})
        </div>
        <div className="flex flex-wrap gap-1">
          {availability
            .filter((av) => av.isAvailable)
            .map((av) => {
              const date = new Date(av.date);
              return (
                <Badge
                  key={av.date}
                  variant="secondary"
                  className="text-xs cursor-pointer"
                  onClick={() => setSelectedDate(av.date)}
                >
                  {date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Badge>
              );
            })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedAvailability && (
        <div className="border border-[--color-border] rounded-[--border-radius-md] p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">
              {new Date(selectedDate!).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleAvailability(selectedDate!)}
                className={cn(
                  selectedAvailability.isAvailable
                    ? 'text-red-600 hover:text-red-700'
                    : 'text-green-600 hover:text-green-700'
                )}
              >
                {selectedAvailability.isAvailable
                  ? 'Mark Unavailable'
                  : 'Mark Available'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveAvailability(selectedDate!)}
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </Button>
            </div>
          </div>

          {selectedAvailability.isAvailable && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Time Slots</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTimeSlot(selectedDate!)}
                  className="text-xs"
                >
                  Add Slot
                </Button>
              </div>

              <div className="space-y-2">
                {selectedAvailability.timeSlots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) =>
                        handleTimeSlotChange(
                          selectedDate!,
                          index,
                          'start',
                          e.target.value
                        )
                      }
                      className="px-2 py-1 text-sm border border-[--color-border] rounded-[--border-radius-sm]"
                    />
                    <span className="text-sm text-[--color-text-secondary]">
                      to
                    </span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) =>
                        handleTimeSlotChange(
                          selectedDate!,
                          index,
                          'end',
                          e.target.value
                        )
                      }
                      className="px-2 py-1 text-sm border border-[--color-border] rounded-[--border-radius-sm]"
                    />
                    {selectedAvailability.timeSlots.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleRemoveTimeSlot(selectedDate!, index)
                        }
                        className="text-red-600 hover:text-red-700 p-1 h-auto"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
