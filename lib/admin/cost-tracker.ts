/**
 * API Cost Tracking System for Admin Demos
 * Tracks costs across all API services
 */

export interface CostEntry {
  timestamp: string;
  api: string;
  endpoint: string;
  cost: number;
  currency: string;
  details?: Record<string, any>;
}

export interface APICostConfig {
  name: string;
  pricing: {
    perCall?: number;
    perToken?: number;
    perImage?: number;
    perMapLoad?: number;
    perGeocode?: number;
    custom?: (details: any) => number;
  };
  freeQuota?: {
    daily?: number;
    monthly?: number;
  };
}

// API cost configurations
const API_COSTS: Record<string, APICostConfig> = {
  openai: {
    name: "OpenAI",
    pricing: {
      custom: (details) => {
        const model = details.model || "gpt-4o";
        const inputTokens = details.inputTokens || 0;
        const outputTokens = details.outputTokens || 0;

        const pricing: Record<string, { input: number; output: number }> = {
          "gpt-4o": { input: 0.0025, output: 0.01 },
          "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
          "o1-preview": { input: 0.015, output: 0.06 },
          "o1-mini": { input: 0.003, output: 0.012 },
        };

        const prices = pricing[model] || pricing["gpt-4o"];
        return (inputTokens / 1000) * prices.input + (outputTokens / 1000) * prices.output;
      },
    },
  },
  imagen: {
    name: "Vertex AI Imagen",
    pricing: {
      perImage: 0.04, // Imagen 4.0
    },
  },
  googleMaps: {
    name: "Google Maps",
    pricing: {
      perMapLoad: 0.007,
      perGeocode: 0.005,
      custom: (details) => {
        const type = details.type;
        if (type === "static") return 0.002;
        if (type === "streetview") return 0.007;
        if (type === "directions") return 0.005;
        if (type === "places") return 0.017;
        return 0.007; // Default map load
      },
    },
  },
  amadeus: {
    name: "Amadeus",
    pricing: {
      perCall: 0, // Test environment is free
    },
    freeQuota: {
      daily: 1000,
    },
  },
  openweather: {
    name: "OpenWeatherMap",
    pricing: {
      perCall: 0, // Free tier
    },
    freeQuota: {
      daily: 1000,
    },
  },
  yelp: {
    name: "Yelp Fusion",
    pricing: {
      perCall: 0, // Free tier
    },
    freeQuota: {
      daily: 500,
    },
  },
  viator: {
    name: "Viator",
    pricing: {
      perCall: 0.01, // Estimated
    },
  },
};

class CostTracker {
  private costs: CostEntry[];
  private sessionStart: string;

  constructor() {
    this.costs = this.loadFromStorage();
    this.sessionStart = new Date().toISOString();
  }

  /**
   * Load costs from localStorage
   */
  private loadFromStorage(): CostEntry[] {
    if (typeof window === "undefined") return [];

    const stored = localStorage.getItem("admin_api_costs");
    if (!stored) return [];

    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  /**
   * Save costs to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    localStorage.setItem("admin_api_costs", JSON.stringify(this.costs));
  }

  /**
   * Track an API call cost
   */
  track(api: string, endpoint: string, details?: Record<string, any>): number {
    const config = API_COSTS[api];
    if (!config) {
      console.warn(`[Cost Tracker] Unknown API: ${api}`);
      return 0;
    }

    let cost = 0;

    if (config.pricing.custom && details) {
      cost = config.pricing.custom(details);
    } else if (config.pricing.perCall) {
      cost = config.pricing.perCall;
    } else if (config.pricing.perToken && details?.tokens) {
      cost = (details.tokens / 1000) * config.pricing.perToken;
    } else if (config.pricing.perImage && details?.imageCount) {
      cost = details.imageCount * config.pricing.perImage;
    } else if (config.pricing.perMapLoad) {
      cost = config.pricing.perMapLoad;
    }

    const entry: CostEntry = {
      timestamp: new Date().toISOString(),
      api: config.name,
      endpoint,
      cost,
      currency: "USD",
      details,
    };

    this.costs.push(entry);
    this.saveToStorage();

    console.log(`[Cost Tracker] ${api} - ${endpoint}: $${cost.toFixed(4)}`, details);

    return cost;
  }

  /**
   * Get total cost
   */
  getTotalCost(filter?: {
    api?: string;
    since?: Date;
    until?: Date;
  }): number {
    let filtered = this.costs;

    if (filter?.api) {
      filtered = filtered.filter((c) => c.api === filter.api);
    }

    if (filter?.since) {
      filtered = filtered.filter((c) => new Date(c.timestamp) >= filter.since!);
    }

    if (filter?.until) {
      filtered = filtered.filter((c) => new Date(c.timestamp) <= filter.until!);
    }

    return filtered.reduce((sum, entry) => sum + entry.cost, 0);
  }

  /**
   * Get costs by API
   */
  getCostsByAPI(): Record<string, number> {
    const byAPI: Record<string, number> = {};

    for (const entry of this.costs) {
      byAPI[entry.api] = (byAPI[entry.api] || 0) + entry.cost;
    }

    return byAPI;
  }

  /**
   * Get costs by time period
   */
  getCostsByPeriod(period: "hour" | "day" | "week" | "month"): Record<string, number> {
    const now = new Date();
    const byPeriod: Record<string, number> = {};

    for (const entry of this.costs) {
      const timestamp = new Date(entry.timestamp);
      let key: string;

      switch (period) {
        case "hour":
          key = timestamp.toISOString().substring(0, 13);
          break;
        case "day":
          key = timestamp.toISOString().substring(0, 10);
          break;
        case "week":
          const weekStart = new Date(timestamp);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = weekStart.toISOString().substring(0, 10);
          break;
        case "month":
          key = timestamp.toISOString().substring(0, 7);
          break;
      }

      byPeriod[key] = (byPeriod[key] || 0) + entry.cost;
    }

    return byPeriod;
  }

  /**
   * Get session cost (since page load)
   */
  getSessionCost(): number {
    return this.getTotalCost({ since: new Date(this.sessionStart) });
  }

  /**
   * Get today's cost
   */
  getTodayCost(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.getTotalCost({ since: today });
  }

  /**
   * Get this week's cost
   */
  getWeekCost(): number {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return this.getTotalCost({ since: weekStart });
  }

  /**
   * Get this month's cost
   */
  getMonthCost(): number {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return this.getTotalCost({ since: monthStart });
  }

  /**
   * Get call count by API
   */
  getCallCounts(): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const entry of this.costs) {
      counts[entry.api] = (counts[entry.api] || 0) + 1;
    }

    return counts;
  }

  /**
   * Check if approaching free quota limits
   */
  getQuotaWarnings(): Array<{ api: string; used: number; limit: number; percentage: number }> {
    const warnings: Array<{ api: string; used: number; limit: number; percentage: number }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const [apiKey, config] of Object.entries(API_COSTS)) {
      if (!config.freeQuota?.daily) continue;

      const todayCalls = this.costs.filter(
        (c) => c.api === config.name && new Date(c.timestamp) >= today
      ).length;

      const percentage = (todayCalls / config.freeQuota.daily) * 100;

      if (percentage >= 80) {
        warnings.push({
          api: config.name,
          used: todayCalls,
          limit: config.freeQuota.daily,
          percentage,
        });
      }
    }

    return warnings;
  }

  /**
   * Export cost data
   */
  export(format: "json" | "csv" = "json"): string {
    if (format === "csv") {
      const headers = ["Timestamp", "API", "Endpoint", "Cost", "Currency"];
      const rows = this.costs.map((c) => [
        c.timestamp,
        c.api,
        c.endpoint,
        c.cost.toFixed(4),
        c.currency,
      ]);

      return [headers, ...rows].map((row) => row.join(",")).join("\n");
    }

    return JSON.stringify(this.costs, null, 2);
  }

  /**
   * Clear all cost data
   */
  clear(): void {
    this.costs = [];
    this.saveToStorage();
    console.log("[Cost Tracker] Cleared all data");
  }

  /**
   * Clear old data (older than specified days)
   */
  clearOld(days: number = 30): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.setDate() - days);

    this.costs = this.costs.filter((c) => new Date(c.timestamp) >= cutoff);
    this.saveToStorage();
    console.log(`[Cost Tracker] Cleared data older than ${days} days`);
  }

  /**
   * Get all cost entries
   */
  getAllEntries(): CostEntry[] {
    return [...this.costs];
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalCost: this.getTotalCost(),
      sessionCost: this.getSessionCost(),
      todayCost: this.getTodayCost(),
      weekCost: this.getWeekCost(),
      monthCost: this.getMonthCost(),
      costsByAPI: this.getCostsByAPI(),
      callCounts: this.getCallCounts(),
      totalCalls: this.costs.length,
      quotaWarnings: this.getQuotaWarnings(),
    };
  }
}

// Singleton instance
const costTracker = new CostTracker();

export default costTracker;

// Export utility functions
export function trackCost(api: string, endpoint: string, details?: Record<string, any>): number {
  return costTracker.track(api, endpoint, details);
}

export function getCostStats() {
  return costTracker.getStats();
}

export function exportCosts(format: "json" | "csv" = "json"): string {
  return costTracker.export(format);
}

export function clearCosts(): void {
  costTracker.clear();
}

export { costTracker };
