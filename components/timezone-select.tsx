"use client";

import { useMemo, useState } from "react";

// Get all IANA timezones and organize them by region
function getTimezones() {
  const timezones = Intl.supportedValuesOf("timeZone");
  
  // Group by region (first part of timezone name)
  const grouped: Record<string, string[]> = {};
  
  for (const tz of timezones) {
    const [region] = tz.split("/");
    if (!grouped[region]) {
      grouped[region] = [];
    }
    grouped[region].push(tz);
  }
  
  return { all: timezones, grouped };
}

// Get current UTC offset for a timezone
function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    return offsetPart?.value || "";
  } catch {
    return "";
  }
}

// Get timezone abbreviation (e.g., EST, PST, CET)
function getTimezoneAbbreviation(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(now);
    const abbrevPart = parts.find((p) => p.type === "timeZoneName");
    return abbrevPart?.value || "";
  } catch {
    return "";
  }
}

// Format timezone for display
function formatTimezoneDisplay(timezone: string): string {
  const offset = getTimezoneOffset(timezone);
  const abbrev = getTimezoneAbbreviation(timezone);
  // Convert America/New_York to New York
  const cityName = timezone.split("/").pop()?.replace(/_/g, " ") || timezone;
  return `${cityName} (${abbrev}, ${offset})`;
}

interface TimezoneSelectProps {
  value?: string;
  onChange: (timezone: string) => void;
  name?: string;
  placeholder?: string;
  className?: string;
}

// Common/popular timezones to show at the top
const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Rome",
  "Europe/Madrid",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export default function TimezoneSelect({
  value,
  onChange,
  name,
  placeholder = "Select timezone...",
  className = "",
}: TimezoneSelectProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { all: allTimezones } = useMemo(() => getTimezones(), []);

  const filteredTimezones = useMemo(() => {
    if (!search) {
      // Show common timezones first, then all others
      const commonSet = new Set(COMMON_TIMEZONES);
      const others = allTimezones.filter((tz) => !commonSet.has(tz));
      return { common: COMMON_TIMEZONES, others };
    }

    const searchLower = search.toLowerCase();
    const filtered = allTimezones.filter((tz) => {
      const cityName = tz.split("/").pop()?.replace(/_/g, " ").toLowerCase() || "";
      const abbrev = getTimezoneAbbreviation(tz).toLowerCase();
      return (
        tz.toLowerCase().includes(searchLower) ||
        cityName.includes(searchLower) ||
        abbrev.includes(searchLower)
      );
    });
    return { common: [], others: filtered };
  }, [search, allTimezones]);

  const displayValue = value ? formatTimezoneDisplay(value) : "";

  return (
    <div className={`relative ${className}`}>
      <input type="hidden" name={name} value={value || ""} />
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left bg-white flex items-center justify-between"
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>
          {displayValue || placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-72 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search timezones..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          
          <div className="overflow-y-auto max-h-56">
            {filteredTimezones.common.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                  Common Timezones
                </div>
                {filteredTimezones.common.map((tz) => (
                  <button
                    key={tz}
                    type="button"
                    onClick={() => {
                      onChange(tz);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 ${
                      value === tz ? "bg-blue-100 text-blue-900" : "text-gray-700"
                    }`}
                  >
                    {formatTimezoneDisplay(tz)}
                  </button>
                ))}
              </>
            )}
            
            {filteredTimezones.others.length > 0 && (
              <>
                {filteredTimezones.common.length > 0 && (
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                    All Timezones
                  </div>
                )}
                {filteredTimezones.others.map((tz) => (
                  <button
                    key={tz}
                    type="button"
                    onClick={() => {
                      onChange(tz);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 ${
                      value === tz ? "bg-blue-100 text-blue-900" : "text-gray-700"
                    }`}
                  >
                    {formatTimezoneDisplay(tz)}
                  </button>
                ))}
              </>
            )}

            {filteredTimezones.common.length === 0 && filteredTimezones.others.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No timezones found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setSearch("");
          }}
        />
      )}
    </div>
  );
}

