'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Web Vitals types
interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// Track if we've already reported for this session
let hasReported = false;
let sessionId: string | null = null;

// Generate or retrieve session ID
function getSessionId(): string {
  if (sessionId) return sessionId;
  
  // Try to get from sessionStorage
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const stored = sessionStorage.getItem('perf-session-id');
    if (stored) {
      sessionId = stored;
      return stored;
    }
    
    // Generate new session ID
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('perf-session-id', sessionId);
    return sessionId;
  }
  
  // Fallback
  sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  return sessionId;
}

// Collect and report metrics
const metrics: Record<string, number> = {};

function reportMetrics(pathname: string) {
  if (hasReported) return;
  if (Object.keys(metrics).length === 0) return;

  hasReported = true;

  // Send metrics to API
  fetch('/api/performance/log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pathname,
      sessionId: getSessionId(),
      ...metrics,
    }),
  }).catch((error) => {
    console.error('[Performance Reporter] Failed to send metrics:', error);
  });
}

function onMetric(metric: Metric, pathname: string) {
  // Store metric
  const metricName = metric.name.toLowerCase();
  metrics[metricName] = metric.value;

  // Report after we have LCP (usually the last important metric)
  if (metric.name === 'LCP') {
    // Wait a bit to collect any remaining metrics
    setTimeout(() => reportMetrics(pathname), 1000);
  }
}

export function PerformanceReporter() {
  const pathname = usePathname();

  useEffect(() => {
    // Reset for new page
    hasReported = false;
    Object.keys(metrics).forEach(key => delete metrics[key]);

    // Check if performance tracking is enabled
    const isEnabled = process.env.NEXT_PUBLIC_PERFORMANCE_TRACKING_ENABLED === 'true';
    if (!isEnabled) return;

    // Dynamic import of web-vitals to avoid SSR issues
    import('web-vitals').then(({ onCLS, onFCP, onFID, onLCP, onTTFB, onINP }) => {
      // Track all Web Vitals
      onCLS((metric) => onMetric(metric, pathname));
      onFCP((metric) => onMetric(metric, pathname));
      onFID((metric) => onMetric(metric, pathname));
      onLCP((metric) => onMetric(metric, pathname));
      onTTFB((metric) => onMetric(metric, pathname));
      onINP((metric) => onMetric(metric, pathname));
    }).catch((error) => {
      console.error('[Performance Reporter] Failed to load web-vitals:', error);
    });

    // Fallback: report after 10 seconds if LCP hasn't fired
    const fallbackTimer = setTimeout(() => {
      if (!hasReported && Object.keys(metrics).length > 0) {
        reportMetrics(pathname);
      }
    }, 10000);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [pathname]);

  return null; // This component doesn't render anything
}
