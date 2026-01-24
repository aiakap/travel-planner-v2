"use client";

import { useState, useEffect, useRef } from "react";

interface ClickToEditFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "textarea";
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * Click-to-edit field component
 * Displays value as text, becomes editable input on click
 * Auto-saves on blur
 */
export function ClickToEditField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "Add...",
  icon,
  className = "",
  disabled = false
}: ClickToEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && type === "text") {
      e.preventDefault();
      setIsEditing(false);
      if (localValue !== value) {
        onChange(localValue);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  if (disabled) {
    return (
      <div className={`px-3 py-2 ${className}`}>
        <span className="text-sm text-slate-500 block mb-1">{label}</span>
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-base text-slate-700">
            {value || <span className="text-slate-400 italic">{placeholder}</span>}
          </span>
        </div>
      </div>
    );
  }

  if (isEditing) {
    const inputClasses = "w-full border-b-2 border-blue-400 focus:outline-none focus:border-blue-600 pb-1 bg-transparent text-base";
    
    return (
      <div className={`px-3 py-2 ${className}`}>
        <span className="text-sm text-slate-500 block mb-1">{label}</span>
        {type === "textarea" ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`${inputClasses} min-h-[100px] resize-none`}
            placeholder={placeholder}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={inputClasses}
            placeholder={placeholder}
          />
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => !disabled && setIsEditing(true)}
      className={`cursor-pointer hover:bg-slate-50 rounded px-3 py-2 transition-colors group ${className}`}
    >
      <span className="text-sm text-slate-500 block mb-1">{label}</span>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon}
          <span className="text-base text-slate-900 truncate">
            {value || <span className="text-slate-400 italic">{placeholder}</span>}
          </span>
        </div>
        <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
          click to edit
        </span>
      </div>
    </div>
  );
}
