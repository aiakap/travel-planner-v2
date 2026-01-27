"use client";

import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';

interface DateChangeOption {
  id: string;
  title: string;
  description: string;
  action: 'adjust_trip_start' | 'adjust_trip_end' | 'take_from_chapter';
  targetChapterIndex?: number;
}

interface DateChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  changeType: 'chapter_increase' | 'chapter_decrease' | 'trip_duration_change';
  daysDelta: number; // positive = adding days, negative = removing days
  sourceChapterIndex?: number; // Which chapter initiated the change
  sourceChapterName?: string;
  chapters: Array<{ name: string; days: number; index: number }>;
  currentTripStart: string;
  currentTripEnd: string;
  onApply: (action: string, targetChapterIndex?: number) => void;
}

export function DateChangeModal({
  isOpen,
  onClose,
  changeType,
  daysDelta,
  sourceChapterIndex,
  sourceChapterName,
  chapters,
  currentTripStart,
  currentTripEnd,
  onApply,
}: DateChangeModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAdding = daysDelta > 0;
  const daysText = Math.abs(daysDelta) === 1 ? '1 day' : `${Math.abs(daysDelta)} days`;

  // Generate options based on change type
  const options: DateChangeOption[] = [];

  if (isAdding) {
    // Adding days
    options.push({
      id: 'adjust_trip_end',
      title: `Extend journey by ${daysText}`,
      description: `Push the end date from ${formatDateReadable(currentTripEnd)} to ${formatDateReadable(addDays(currentTripEnd, daysDelta))}`,
      action: 'adjust_trip_end'
    });

    options.push({
      id: 'adjust_trip_start',
      title: `Start journey ${daysText} earlier`,
      description: `Move the start date from ${formatDateReadable(currentTripStart)} to ${formatDateReadable(addDays(currentTripStart, -daysDelta))}`,
      action: 'adjust_trip_start'
    });

    // Take from other chapters
    chapters
      .filter((ch) => ch.index !== sourceChapterIndex && ch.days > daysDelta)
      .forEach((ch) => {
        options.push({
          id: `take_from_${ch.index}`,
          title: `Take ${daysText} from "${ch.name}"`,
          description: `Reduce "${ch.name}" from ${ch.days} to ${ch.days - daysDelta} days`,
          action: 'take_from_chapter',
          targetChapterIndex: ch.index
        });
      });

  } else {
    // Removing days
    options.push({
      id: 'adjust_trip_end',
      title: `Shorten journey by ${daysText}`,
      description: `Move the end date from ${formatDateReadable(currentTripEnd)} to ${formatDateReadable(addDays(currentTripEnd, daysDelta))}`,
      action: 'adjust_trip_end'
    });

    options.push({
      id: 'adjust_trip_start',
      title: `Start journey ${daysText} later`,
      description: `Move the start date from ${formatDateReadable(currentTripStart)} to ${formatDateReadable(addDays(currentTripStart, -daysDelta))}`,
      action: 'adjust_trip_start'
    });

    // Add to other chapters
    chapters
      .filter((ch) => ch.index !== sourceChapterIndex)
      .forEach((ch) => {
        options.push({
          id: `add_to_${ch.index}`,
          title: `Add ${daysText} to "${ch.name}"`,
          description: `Extend "${ch.name}" from ${ch.days} to ${ch.days + Math.abs(daysDelta)} days`,
          action: 'take_from_chapter',
          targetChapterIndex: ch.index
        });
      });
  }

  const handleApply = () => {
    const selected = options.find((opt) => opt.id === selectedOption);
    if (selected) {
      onApply(selected.action, selected.targetChapterIndex);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar className="text-indigo-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">
              {isAdding ? 'Adding' : 'Removing'} {daysText}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {sourceChapterName ? (
                <>
                  You're {isAdding ? 'adding' : 'removing'} <span className="font-semibold">{daysText}</span> {isAdding ? 'to' : 'from'} "{sourceChapterName}". 
                  How would you like to handle this change?
                </>
              ) : (
                <>
                  You're changing the journey duration. How would you like to adjust your itinerary?
                </>
              )}
            </p>
          </div>

          <div className="space-y-2">
            {options.map((option) => (
              <label
                key={option.id}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedOption === option.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="dateChangeOption"
                  checked={selectedOption === option.id}
                  onChange={() => setSelectedOption(option.id)}
                  className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">{option.title}</div>
                  <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedOption}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper functions
const formatDateReadable = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const addDays = (date: Date | string, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
};
