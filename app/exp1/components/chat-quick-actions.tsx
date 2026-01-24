"use client";

import { ChatQuickAction } from "@/lib/personalization";

interface ChatQuickActionsProps {
  suggestions: ChatQuickAction[];
  onSelect: (prompt: string) => void;
}

export function ChatQuickActions({ suggestions, onSelect }: ChatQuickActionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <p className="text-sm text-slate-400">Suggestions</p>
      
      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSelect(suggestion.prompt)}
            className="w-full text-left px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors duration-150 text-sm text-slate-700 hover:text-slate-900"
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  );
}
