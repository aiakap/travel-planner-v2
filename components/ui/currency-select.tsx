"use client"

import * as React from "react"
import { ChevronDown, Search, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CURRENCIES, COMMON_CURRENCIES, getCurrencyByCode, type Currency } from "@/lib/currencies"

interface CurrencySelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  showSymbol?: boolean
}

export function CurrencySelect({
  value,
  onChange,
  className,
  disabled = false,
  showSymbol = false,
}: CurrencySelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  const selectedCurrency = getCurrencyByCode(value)
  
  // Filter currencies based on search
  const filteredCurrencies = React.useMemo(() => {
    if (!search.trim()) {
      return COMMON_CURRENCIES
    }
    
    const searchLower = search.toLowerCase()
    return CURRENCIES.filter(currency => 
      currency.code.toLowerCase().includes(searchLower) ||
      currency.name.toLowerCase().includes(searchLower)
    ).slice(0, 20) // Limit results for performance
  }, [search])

  // Focus input when popover opens
  React.useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
    if (!open) {
      setSearch("")
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm",
            "bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            "border border-slate-200",
            disabled && "opacity-50 cursor-not-allowed hover:bg-slate-100",
            className
          )}
        >
          {selectedCurrency ? (
            <>
              <span className="text-base leading-none">{selectedCurrency.flag}</span>
              <span className="font-medium text-slate-700">
                {showSymbol ? selectedCurrency.symbol : selectedCurrency.code}
              </span>
            </>
          ) : (
            <span className="text-slate-500">Currency</span>
          )}
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-0" 
        align="start"
        sideOffset={4}
      >
        {/* Search input */}
        <div className="p-2 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search currencies..."
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-200 
                focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>
        </div>
        
        {/* Currency list */}
        <div className="max-h-64 overflow-y-auto p-1">
          {!search && (
            <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Common currencies
            </div>
          )}
          
          {filteredCurrencies.length === 0 ? (
            <div className="px-2 py-4 text-sm text-slate-500 text-center">
              No currencies found
            </div>
          ) : (
            filteredCurrencies.map((currency) => (
              <CurrencyOption
                key={currency.code}
                currency={currency}
                isSelected={value === currency.code}
                onSelect={() => {
                  onChange(currency.code)
                  setOpen(false)
                }}
              />
            ))
          )}
          
          {!search && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                className="w-full px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 
                  hover:bg-slate-50 rounded transition-colors text-left"
                onClick={() => inputRef.current?.focus()}
              >
                Type to search all currencies...
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface CurrencyOptionProps {
  currency: Currency
  isSelected: boolean
  onSelect: () => void
}

function CurrencyOption({ currency, isSelected, onSelect }: CurrencyOptionProps) {
  return (
    <button
      type="button"
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm",
        "hover:bg-slate-100 transition-colors text-left",
        isSelected && "bg-slate-50"
      )}
      onClick={onSelect}
    >
      <span className="text-lg leading-none flex-shrink-0">{currency.flag}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-slate-700">{currency.code}</span>
          <span className="text-slate-400">{currency.symbol}</span>
        </div>
        <div className="text-xs text-slate-500 truncate">{currency.name}</div>
      </div>
      {isSelected && (
        <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
      )}
    </button>
  )
}

// Compact inline display of currency (for showing next to amount)
interface CurrencyBadgeProps {
  code: string
  onClick?: () => void
  className?: string
}

export function CurrencyBadge({ code, onClick, className }: CurrencyBadgeProps) {
  const currency = getCurrencyByCode(code)
  
  if (!currency) {
    return (
      <span className={cn("text-xs text-slate-500", className)}>
        {code}
      </span>
    )
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs",
          "bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer",
          className
        )}
      >
        <span>{currency.flag}</span>
        <span className="font-medium">{currency.code}</span>
      </button>
    )
  }

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-slate-500", className)}>
      <span>{currency.flag}</span>
      <span>{currency.code}</span>
    </span>
  )
}
