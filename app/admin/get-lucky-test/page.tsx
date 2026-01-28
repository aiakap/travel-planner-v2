'use client';

import { useState } from 'react';

interface DebugOutput {
  stage: string;
  success?: boolean;
  data?: any;
  error?: string;
  timing?: number;
  timestamp?: string;
}

export default function GetLuckyTestPage() {
  const [testParams, setTestParams] = useState({
    destination: 'Barcelona, Spain',
    budgetLevel: 'moderate',
    activityLevel: 'Moderate',
    startDate: '2026-03-01',
    endDate: '2026-03-08',
  });
  
  const [debugOutput, setDebugOutput] = useState<DebugOutput[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [buffer, setBuffer] = useState('');
  
  const runTest = async () => {
    setIsRunning(true);
    setDebugOutput([]);
    setBuffer('');
    
    try {
      const response = await fetch('/api/admin/test/get-lucky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testParams),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      const decoder = new TextDecoder();
      let localBuffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value, { stream: true });
        localBuffer += text;
        setBuffer(localBuffer);
        
        const lines = localBuffer.split('\n');
        localBuffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              setDebugOutput(prev => [...prev, data]);
            } catch (e) {
              console.error('Failed to parse SSE data:', line, e);
            }
          }
        }
      }
    } catch (error: any) {
      setDebugOutput(prev => [...prev, {
        stage: 'error',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsRunning(false);
    }
  };
  
  const downloadLogs = () => {
    const dataStr = JSON.stringify(debugOutput, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `get-lucky-debug-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  const clearLogs = () => {
    setDebugOutput([]);
    setBuffer('');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Get Lucky Debug Harness</h1>
          <p className="text-gray-600">Test the Surprise Trip feature with detailed debugging output</p>
        </div>
        
        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Parameters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination
              </label>
              <input
                type="text"
                value={testParams.destination}
                onChange={(e) => setTestParams({ ...testParams, destination: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Barcelona, Spain"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Level
              </label>
              <select
                value={testParams.budgetLevel}
                onChange={(e) => setTestParams({ ...testParams, budgetLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="budget">Budget</option>
                <option value="moderate">Moderate</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Level
              </label>
              <select
                value={testParams.activityLevel}
                onChange={(e) => setTestParams({ ...testParams, activityLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Relaxed">Relaxed</option>
                <option value="Moderate">Moderate</option>
                <option value="Active">Active</option>
                <option value="Adventurous">Adventurous</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={testParams.startDate}
                onChange={(e) => setTestParams({ ...testParams, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={testParams.endDate}
                onChange={(e) => setTestParams({ ...testParams, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={runTest}
              disabled={isRunning}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                isRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isRunning ? 'Running Test...' : 'Run Test'}
            </button>
            
            {debugOutput.length > 0 && (
              <>
                <button
                  onClick={downloadLogs}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
                >
                  Download Logs
                </button>
                
                <button
                  onClick={clearLogs}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors"
                >
                  Clear Logs
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Debug Output */}
        {debugOutput.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Output ({debugOutput.length} stages)</h2>
            
            <div className="space-y-3">
              {debugOutput.map((output, i) => (
                <div
                  key={i}
                  className={`border rounded-lg p-4 ${
                    output.success === false
                      ? 'bg-red-50 border-red-300'
                      : output.success === true
                      ? 'bg-green-50 border-green-300'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm">
                        {output.stage.toUpperCase()}
                      </span>
                      {output.success !== undefined && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          output.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                        }`}>
                          {output.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                      )}
                      {output.timing && (
                        <span className="text-xs text-gray-500">
                          {output.timing}ms
                        </span>
                      )}
                    </div>
                    {output.timestamp && (
                      <span className="text-xs text-gray-500">
                        {new Date(output.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  
                  {output.error && (
                    <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-800">
                      <strong>Error:</strong> {output.error}
                    </div>
                  )}
                  
                  {output.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                        View Data
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded text-xs overflow-x-auto">
                        {JSON.stringify(output.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Status indicator */}
        {isRunning && debugOutput.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Initializing test...</p>
          </div>
        )}
        
        {!isRunning && debugOutput.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            Click "Run Test" to start debugging the Get Lucky feature
          </div>
        )}
      </div>
    </div>
  );
}
