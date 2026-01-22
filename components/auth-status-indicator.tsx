"use client";

/**
 * Auth Status Indicator Component
 * Visual indicator for authentication status (development mode only)
 */

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface AuthStatus {
  status: "healthy" | "warning" | "error" | "loading";
  issues: string[];
  timestamp: string;
}

export function AuthStatusIndicator() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    status: "loading",
    issues: [],
    timestamp: new Date().toISOString(),
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    setIsVisible(true);

    // Fetch auth status
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/auth/validate");
        if (response.ok) {
          const data = await response.json();
          setAuthStatus({
            status: data.status || "error",
            issues: data.issues || [],
            timestamp: data.timestamp,
          });
        } else {
          setAuthStatus({
            status: "error",
            issues: ["Failed to fetch auth status"],
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        setAuthStatus({
          status: "error",
          issues: ["Network error fetching auth status"],
          timestamp: new Date().toISOString(),
        });
      }
    };

    fetchStatus();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return null;
  }

  const StatusIcon = () => {
    switch (authStatus.status) {
      case "healthy":
        return <CheckCircle2 className="w-3 h-3 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-3 h-3 text-yellow-600" />;
      case "error":
        return <XCircle className="w-3 h-3 text-red-600" />;
      case "loading":
        return <Loader2 className="w-3 h-3 animate-spin text-blue-600" />;
    }
  };

  const statusColors = {
    healthy: "bg-green-100 text-green-800 border-green-300",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
    error: "bg-red-100 text-red-800 border-red-300",
    loading: "bg-blue-100 text-blue-800 border-blue-300",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link href="/auth/debug">
        <div
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg border-2 shadow-lg
            cursor-pointer transition-all hover:scale-105
            ${statusColors[authStatus.status]}
          `}
          title={`Auth Status: ${authStatus.status}\n${authStatus.issues.join("\n")}\nClick to view details`}
        >
          <StatusIcon />
          <span className="text-xs font-medium">Auth: {authStatus.status}</span>
          {authStatus.issues.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {authStatus.issues.length}
            </Badge>
          )}
        </div>
      </Link>

      {/* Tooltip on hover */}
      {authStatus.issues.length > 0 && (
        <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-64 p-3 bg-white border rounded-lg shadow-xl">
          <div className="text-xs font-semibold mb-2">Issues Detected:</div>
          <ul className="text-xs space-y-1">
            {authStatus.issues.slice(0, 3).map((issue, i) => (
              <li key={i} className="text-slate-600">
                • {issue}
              </li>
            ))}
            {authStatus.issues.length > 3 && (
              <li className="text-slate-500 italic">
                +{authStatus.issues.length - 3} more...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
