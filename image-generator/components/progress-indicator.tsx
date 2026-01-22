"use client";

interface ProgressIndicatorProps {
  stats: {
    total: number;
    pending: number;
    waiting: number;
    processing: number;
    completed: number;
    error: number;
  };
}

export function ProgressIndicator({ stats }: ProgressIndicatorProps) {
  if (stats.total === 0) {
    return null;
  }

  const inProgress = stats.pending + stats.waiting + stats.processing;
  const done = stats.completed + stats.error;
  const percentComplete = (done / stats.total) * 100;

  if (inProgress === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="text-2xl">✅</div>
          <div>
            <div className="font-semibold text-green-800">All Done!</div>
            <div className="text-sm text-green-600">
              {stats.completed} completed, {stats.error} errors
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="text-2xl animate-spin">🔄</div>
        <div className="flex-1">
          <div className="font-semibold text-blue-800">
            Processing {inProgress} of {stats.total} prompts...
          </div>
          <div className="text-sm text-blue-600">
            {stats.processing} processing, {stats.waiting} waiting, {stats.pending} pending
          </div>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
