"use client";

import { QueueItem } from "../lib/queue-manager";

interface QueueDisplayProps {
  queue: QueueItem[];
  stats: {
    total: number;
    pending: number;
    waiting: number;
    processing: number;
    completed: number;
    error: number;
  };
}

export function QueueDisplay({ queue, stats }: QueueDisplayProps) {
  if (queue.length === 0) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "⏸️";
      case "waiting":
        return "⏳";
      case "processing":
        return "🔄";
      case "completed":
        return "✅";
      case "error":
        return "❌";
      default:
        return "❓";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-gray-500";
      case "waiting":
        return "text-yellow-500";
      case "processing":
        return "text-blue-500";
      case "completed":
        return "text-green-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Queue Status</h2>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-100 rounded">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="text-center p-3 bg-gray-100 rounded">
          <div className="text-2xl font-bold">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="text-center p-3 bg-yellow-100 rounded">
          <div className="text-2xl font-bold">{stats.waiting}</div>
          <div className="text-sm text-gray-600">Waiting</div>
        </div>
        <div className="text-center p-3 bg-blue-100 rounded">
          <div className="text-2xl font-bold">{stats.processing}</div>
          <div className="text-sm text-gray-600">Processing</div>
        </div>
        <div className="text-center p-3 bg-green-100 rounded">
          <div className="text-2xl font-bold">{stats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="text-center p-3 bg-red-100 rounded">
          <div className="text-2xl font-bold">{stats.error}</div>
          <div className="text-sm text-gray-600">Errors</div>
        </div>
      </div>

      {/* Progress bar */}
      {stats.total > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{stats.completed + stats.error} / {stats.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-500 h-4 rounded-full transition-all duration-300"
              style={{
                width: `${((stats.completed + stats.error) / stats.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Queue items */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {queue.map((item) => (
          <div
            key={item.id}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{getStatusIcon(item.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold ${getStatusColor(item.status)}`}>
                    {item.status.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {item.filename}
                  </span>
                </div>
                <p className="text-sm text-gray-700 truncate">{item.prompt}</p>
                {item.errorMessage && (
                  <p className="text-sm text-red-600 mt-1">
                    Error: {item.errorMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
