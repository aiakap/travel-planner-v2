'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PageStats {
  pathname: string;
  count: number;
  avgServerTime: number;
  avgDbTime: number;
  avgExternalApiTime: number;
  avgTotalTime: number;
  avgQueryCount: number;
  p95ServerTime: number;
  p99ServerTime: number;
}

interface QueryStats {
  model: string;
  action: string;
  count: number;
  avgDuration: number;
  totalDuration: number;
}

interface TimelinePoint {
  hour: string;
  count: number;
  avgTime: number;
}

interface DashboardStats {
  pageStats: PageStats[];
  queryStats: QueryStats[];
  timeline: TimelinePoint[];
  totalRequests: number;
  timeRange: number;
}

export function PerformanceDashboard({ stats }: { stats: DashboardStats }) {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState(stats.timeRange.toString());

  const handleTimeRangeChange = (hours: string) => {
    setTimeRange(hours);
    router.push(`/admin/performance?hours=${hours}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Performance Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor page load times and identify performance bottlenecks
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1">Last 1 hour</option>
            <option value="6">Last 6 hours</option>
            <option value="24">Last 24 hours</option>
            <option value="72">Last 3 days</option>
            <option value="168">Last 7 days</option>
          </select>
          <span className="text-sm text-gray-600">
            {stats.totalRequests} total requests
          </span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Total Requests
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {stats.totalRequests}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Unique Pages
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {stats.pageStats.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Avg Load Time
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {Math.round(
                stats.pageStats.reduce((sum, p) => sum + p.avgTotalTime, 0) /
                  (stats.pageStats.length || 1)
              )}
              <span className="text-lg text-gray-500 ml-1">ms</span>
            </p>
          </div>
        </div>

        {/* Slowest Pages */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Slowest Pages
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Page
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Server
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg DB
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg API
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Queries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P95
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P99
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.pageStats.map((page) => (
                  <tr key={page.pathname} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {page.pathname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {page.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className={
                          page.avgTotalTime > 2000
                            ? 'text-red-600 font-semibold'
                            : page.avgTotalTime > 1000
                            ? 'text-yellow-600 font-semibold'
                            : 'text-green-600'
                        }
                      >
                        {page.avgTotalTime}ms
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {page.avgServerTime}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {page.avgDbTime}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {page.avgExternalApiTime}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {page.avgQueryCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {page.p95ServerTime}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {page.p99ServerTime}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Query Hotspots */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Database Query Hotspots
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Top 20 most time-consuming queries
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.queryStats.map((query, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {query.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {query.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {query.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {query.avgDuration}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className={
                          query.totalDuration > 10000
                            ? 'text-red-600 font-semibold'
                            : query.totalDuration > 5000
                            ? 'text-yellow-600 font-semibold'
                            : ''
                        }
                      >
                        {query.totalDuration}ms
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Performance Timeline
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Hourly average load times
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.timeline.map((point) => (
                <div key={point.hour} className="flex items-center gap-4">
                  <div className="text-sm text-gray-600 w-40">
                    {new Date(point.hour).toLocaleString()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                        <div
                          className={`h-6 rounded-full ${
                            point.avgTime > 2000
                              ? 'bg-red-500'
                              : point.avgTime > 1000
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{
                            width: `${Math.min((point.avgTime / 3000) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="text-sm text-gray-900 w-20 text-right">
                        {point.avgTime}ms
                      </div>
                      <div className="text-sm text-gray-500 w-20">
                        ({point.count} req)
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
