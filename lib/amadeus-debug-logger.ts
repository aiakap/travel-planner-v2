type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
  stack?: string;
}

class AmadeusDebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private enabled = true;

  log(level: LogLevel, component: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data: data ? this.sanitizeData(data) : undefined,
      stack: level === 'error' ? new Error().stack : undefined
    };

    this.logs.push(entry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with colors
    const color = {
      info: '\x1b[36m',    // Cyan
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      debug: '\x1b[90m'    // Gray
    }[level];

    console.log(
      `${color}[${level.toUpperCase()}] [${component}]\x1b[0m ${message}`,
      data ? data : ''
    );

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('amadeus_debug_logs', JSON.stringify(this.logs.slice(-100)));
      } catch (e) {
        console.warn('Failed to save logs to localStorage:', e);
      }
    }
  }

  info(component: string, message: string, data?: any) {
    this.log('info', component, message, data);
  }

  warn(component: string, message: string, data?: any) {
    this.log('warn', component, message, data);
  }

  error(component: string, message: string, error?: any) {
    this.log('error', component, message, {
      error: error?.message || error,
      stack: error?.stack
    });
  }

  debug(component: string, message: string, data?: any) {
    this.log('debug', component, message, data);
  }

  // Sanitize sensitive data
  private sanitizeData(data: any): any {
    if (!data) return data;
    
    const sanitized = JSON.parse(JSON.stringify(data));
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'creditCard'];
    
    const sanitizeObject = (obj: any) => {
      for (const key in obj) {
        if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  }

  // Get all logs
  getLogs(level?: LogLevel): LogEntry[] {
    return level ? this.logs.filter(l => l.level === level) : this.logs;
  }

  // Clear logs
  clear() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('amadeus_debug_logs');
    }
  }

  // Export logs as JSON
  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Download logs as file
  downloadLogs() {
    if (typeof window === 'undefined') return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(this.export());
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `amadeus-logs-${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}

export const amadeusLogger = new AmadeusDebugLogger();

// Error boundary wrapper
export function withErrorLogging<T>(
  component: string,
  fn: () => T,
  fallback?: T
): T {
  try {
    amadeusLogger.debug(component, 'Executing function');
    const result = fn();
    amadeusLogger.debug(component, 'Function completed successfully');
    return result;
  } catch (error) {
    amadeusLogger.error(component, 'Function failed', error);
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}

// Async error boundary wrapper
export async function withAsyncErrorLogging<T>(
  component: string,
  fn: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    amadeusLogger.debug(component, 'Executing async function');
    const result = await fn();
    amadeusLogger.debug(component, 'Async function completed successfully');
    return result;
  } catch (error) {
    amadeusLogger.error(component, 'Async function failed', error);
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}
