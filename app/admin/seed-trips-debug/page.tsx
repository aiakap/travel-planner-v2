'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, Loader2, Terminal, CheckCircle, XCircle, 
  AlertCircle, Download, Trash2
} from 'lucide-react';
import { searchUsers } from '@/lib/actions/admin-user-cleanup';

type TripSize = 'large' | 'medium' | 'small' | 'micro';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'success' | 'warning';
  message: string;
  data?: any;
}

export default function SeedTripsDebugPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<TripSize | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (level: LogEntry['level'], message: string, data?: any) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    }]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedUser(null);
    addLog('info', 'Searching for users...', { query: searchQuery });

    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
      addLog('success', `Found ${results.length} user(s)`, { count: results.length });
      
      if (results.length === 0) {
        setError('No users found matching your query');
        addLog('warning', 'No users found');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to search users';
      setError(errorMsg);
      addLog('error', 'Search failed', { error: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setSearchResults([]);
    setError(null);
    addLog('info', 'User selected', { email: user.email, id: user.id });
  };

  const handleGenerateTrip = async (tripSize: TripSize) => {
    if (!selectedUser) return;

    setGenerating(tripSize);
    setError(null);
    addLog('info', `Starting ${tripSize} trip generation...`, { 
      userId: selectedUser.id,
      email: selectedUser.email 
    });

    try {
      const startTime = Date.now();
      
      const response = await fetch('/api/admin/seed-trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          tripSize,
          debug: true, // Enable debug mode
        }),
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate trip');
      }

      addLog('success', `✅ Trip generated successfully in ${duration}ms`, {
        tripId: data.tripId,
        segments: data.summary.segmentCount,
        reservations: data.summary.reservationCount,
        duration
      });

      addLog('info', 'Trip summary', data.summary);
      
      if (data.summary.reservationsByType) {
        addLog('info', 'Reservations by type', data.summary.reservationsByType);
      }
      
      if (data.summary.reservationsByStatus) {
        addLog('info', 'Reservations by status', data.summary.reservationsByStatus);
      }

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to generate trip';
      setError(errorMsg);
      addLog('error', '❌ Generation failed', { 
        error: errorMsg,
        stack: err.stack 
      });
    } finally {
      setGenerating(null);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Logs cleared');
  };

  const downloadLogs = () => {
    const logText = logs.map(log => {
      const data = log.data ? `\n${JSON.stringify(log.data, null, 2)}` : '';
      return `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}${data}`;
    }).join('\n\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seed-trip-debug-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
    
    addLog('info', 'Logs downloaded');
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      default: return <Terminal className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Terminal className="h-8 w-8" />
          Seed Trip Debug Console
        </h1>
        <p className="text-muted-foreground">
          Detailed logging and debugging for seed trip generation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Controls */}
        <div className="space-y-6">
          {/* User Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Select User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 mb-4">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-accent"
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="font-medium">{user.email}</div>
                      {user.name && <div className="text-sm text-muted-foreground">{user.name}</div>}
                    </div>
                  ))}
                </div>
              )}

              {selectedUser && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <strong>Selected:</strong> {selectedUser.email}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Trip Generation */}
          {selectedUser && (
            <Card>
              <CardHeader>
                <CardTitle>Generate Trip</CardTitle>
                <CardDescription>Select a trip size to generate with debug logging</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => handleGenerateTrip('large')}
                  disabled={!!generating}
                  className="w-full"
                  variant={generating === 'large' ? 'default' : 'outline'}
                >
                  {generating === 'large' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating Large...
                    </>
                  ) : (
                    '🌍 Large (21 days) - Grand European Tour'
                  )}
                </Button>
                <Button
                  onClick={() => handleGenerateTrip('medium')}
                  disabled={!!generating}
                  className="w-full"
                  variant="outline"
                >
                  {generating === 'medium' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating Medium...
                    </>
                  ) : (
                    '🗼 Medium (10 days) - Paris & Tuscany'
                  )}
                </Button>
                <Button
                  onClick={() => handleGenerateTrip('small')}
                  disabled={!!generating}
                  className="w-full"
                  variant="outline"
                >
                  {generating === 'small' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating Small...
                    </>
                  ) : (
                    '🚲 Small (5 days) - Amsterdam Weekend'
                  )}
                </Button>
                <Button
                  onClick={() => handleGenerateTrip('micro')}
                  disabled={!!generating}
                  className="w-full"
                  variant="outline"
                >
                  {generating === 'micro' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating Micro...
                    </>
                  ) : (
                    '⚡ Micro (2 days) - Paris Quick Visit'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Right Column: Logs */}
        <Card className="lg:sticky lg:top-4 h-fit max-h-[calc(100vh-8rem)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Debug Logs
                <Badge variant="outline">{logs.length}</Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={downloadLogs} disabled={logs.length === 0}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={clearLogs} disabled={logs.length === 0}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No logs yet. Generate a trip to see debug output.
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={`p-2 rounded border ${getLevelColor(log.level)}`}>
                    <div className="flex items-start gap-2">
                      {getLevelIcon(log.level)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs opacity-70">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {log.level}
                          </Badge>
                        </div>
                        <div className="font-medium">{log.message}</div>
                        {log.data && (
                          <pre className="mt-2 text-xs bg-black/5 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
