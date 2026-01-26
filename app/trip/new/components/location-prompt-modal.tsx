"use client";

import React, { useState } from 'react';
import { X, Check, MapPin } from 'lucide-react';

interface LocationSuggestion {
  title: string;
  description: string;
  targets: Array<{ index: number; field: 'start_location' | 'end_location'; name: string; type: string }>;
  autoSelect?: boolean;
}

interface LocationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceChapter: string;
  field: 'start_location' | 'end_location';
  value: string;
  suggestions: LocationSuggestion[];
  onApply: (selections: Array<{ index: number; field: 'start_location' | 'end_location' }>) => void;
}

export function LocationPromptModal({
  isOpen,
  onClose,
  sourceChapter,
  field,
  value,
  suggestions,
  onApply
}: LocationPromptModalProps) {
  // Track selections as { index, field } pairs
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // Auto-select targets marked with autoSelect
    suggestions.forEach(suggestion => {
      if (suggestion.autoSelect) {
        suggestion.targets.forEach(target => {
          initial.add(`${target.index}-${target.field}`);
        });
      }
    });
    return initial;
  });

  if (!isOpen) return null;

  const fieldLabel = field === 'start_location' ? 'start location' : 'end location';

  const handleToggle = (index: number, targetField: 'start_location' | 'end_location') => {
    const key = `${index}-${targetField}`;
    const newSelected = new Set(selectedTargets);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedTargets(newSelected);
  };

  const handleSelectAll = () => {
    const allTargets = new Set<string>();
    suggestions.forEach(suggestion => {
      suggestion.targets.forEach(target => {
        allTargets.add(`${target.index}-${target.field}`);
      });
    });
    setSelectedTargets(allTargets);
  };

  const handleSelectNone = () => {
    setSelectedTargets(new Set());
  };

  const handleApply = () => {
    const selections = Array.from(selectedTargets).map(key => {
      const [indexStr, targetField] = key.split('-');
      return {
        index: parseInt(indexStr),
        field: targetField as 'start_location' | 'end_location'
      };
    });
    onApply(selections);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-50 border-b border-indigo-100 p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-white/50 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-start gap-3">
              <div className="bg-indigo-600 text-white p-2 rounded-lg">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Use Location for Other Chapters?
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  You set <span className="font-semibold">"{value}"</span> as the {fieldLabel} for <span className="font-semibold">{sourceChapter}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {suggestions.length > 0 ? (
              <>
                <p className="text-sm text-gray-700 mb-4">
                  Would you like to use this location for any of these chapters?
                </p>

                {/* Select All/None */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={handleSelectNone}
                    className="text-xs font-medium text-gray-600 hover:text-gray-700 hover:underline"
                  >
                    Select None
                  </button>
                </div>

                {/* Grouped Suggestions */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {suggestions.map((suggestion, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-bold text-gray-900">{suggestion.title}</div>
                        {suggestion.description && (
                          <div className="text-xs text-gray-500">· {suggestion.description}</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        {suggestion.targets.map((target) => {
                          const key = `${target.index}-${target.field}`;
                          return (
                            <label
                              key={key}
                              className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedTargets.has(key)}
                                onChange={() => handleToggle(target.index, target.field)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-900">{target.name}</div>
                                <div className="text-xs text-gray-500">
                                  {target.type} · {target.field === 'start_location' ? 'Start' : 'End'} location
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No other chapters need this location</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={selectedTargets.size === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Check size={16} />
              Apply to {selectedTargets.size} Chapter{selectedTargets.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
