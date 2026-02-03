"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Option {
  value: string
  label: string
  icon?: React.ReactNode
}

interface ClickToSelectProps {
  value: string
  options: Option[]
  onChange: (value: string) => void
  icon?: React.ReactNode
  placeholder?: string
  className?: string
  triggerClassName?: string
  disabled?: boolean
}

export function ClickToSelect({
  value,
  options,
  onChange,
  icon,
  placeholder = "Select...",
  className,
  triggerClassName,
  disabled = false,
}: ClickToSelectProps) {
  const [open, setOpen] = React.useState(false)
  
  const selectedOption = options.find(opt => opt.value === value)
  const displayIcon = selectedOption?.icon || icon
  const displayLabel = selectedOption?.label || placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm",
            "hover:bg-slate-100 transition-colors cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
            triggerClassName
          )}
          type="button"
        >
          {displayIcon && (
            <span className="text-slate-500 flex-shrink-0">
              {displayIcon}
            </span>
          )}
          <span className="font-medium text-slate-700 truncate">
            {displayLabel}
          </span>
          <ChevronDown className="h-3 w-3 text-slate-400 flex-shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn("w-56 p-1", className)} 
        align="start"
        sideOffset={4}
      >
        <div className="max-h-64 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm",
                "hover:bg-slate-100 transition-colors text-left",
                value === option.value && "bg-slate-50"
              )}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
            >
              {option.icon && (
                <span className="text-slate-500 flex-shrink-0 w-5">
                  {option.icon}
                </span>
              )}
              <span className="flex-1 truncate">{option.label}</span>
              {value === option.value && (
                <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Status badge variant with colored background
interface StatusOption {
  value: string
  label: string
  color: string
}

interface ClickToSelectStatusProps {
  value: string
  options: StatusOption[]
  onChange: (value: string) => void
  disabled?: boolean
}

function getStatusColor(statusName: string): string {
  switch (statusName.toLowerCase()) {
    case "confirmed":
      return "bg-emerald-100 text-emerald-800 border-emerald-200"
    case "pending":
      return "bg-amber-100 text-amber-800 border-amber-200"
    case "cancelled":
      return "bg-rose-100 text-rose-800 border-rose-200"
    case "completed":
      return "bg-sky-100 text-sky-800 border-sky-200"
    case "waitlisted":
      return "bg-slate-100 text-slate-800 border-slate-200"
    default:
      return "bg-slate-100 text-slate-800 border-slate-200"
  }
}

export function ClickToSelectStatus({
  value,
  options,
  onChange,
  disabled = false,
}: ClickToSelectStatusProps) {
  const [open, setOpen] = React.useState(false)
  
  const selectedOption = options.find(opt => opt.value === value)
  const statusColor = selectedOption ? getStatusColor(selectedOption.label) : "bg-slate-100 text-slate-700"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
            "hover:opacity-80 transition-opacity cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            statusColor,
            disabled && "opacity-50 cursor-not-allowed hover:opacity-50"
          )}
          type="button"
        >
          <span>{selectedOption?.label || "Select..."}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-40 p-1" 
        align="start"
        sideOffset={4}
      >
        <div className="space-y-0.5">
          {options.map((option) => {
            const color = getStatusColor(option.label)
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "w-full flex items-center justify-between px-2 py-1.5 rounded text-sm",
                  "hover:bg-slate-50 transition-colors"
                )}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium border",
                  color
                )}>
                  {option.label}
                </span>
                {value === option.value && (
                  <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
