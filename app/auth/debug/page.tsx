/**
 * Auth Debug Page
 * Comprehensive debugging dashboard for authentication issues
 */

import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Database, 
  Cookie, 
  Key, 
  User, 
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DebugHeaderActions, ClearAuthCookiesButton } from "./debug-header-actions";

async function getDebugData() {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/validate`,
      { cache: "no-store" }
    );
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
  }
}

export default async function AuthDebugPage() {
  const session = await auth();
  const debugData = await getDebugData();

  const StatusIcon = ({ status }: { status: "healthy" | "warning" | "error" | undefined }) => {
    if (status === "healthy") return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (status === "warning") return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const StatusBadge = ({ status }: { status: "healthy" | "warning" | "error" | undefined }) => {
    const variants = {
      healthy: "default" as const,
      warning: "secondary" as const,
      error: "destructive" as const,
    };
    
    return (
      <Badge variant={variants[status || "error"]}>
        {status || "error"}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Auth Debug Dashboard</h1>
            <p className="text-slate-600 mt-1">
              Comprehensive authentication diagnostics
            </p>
          </div>
          <DebugHeaderActions />
        </div>

        {/* Overall Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusIcon status={debugData.status} />
                <div>
                  <CardTitle>Overall Status</CardTitle>
                  <CardDescription>
                    Last checked: {new Date(debugData.timestamp).toLocaleString()}
                  </CardDescription>
                </div>
              </div>
              <StatusBadge status={debugData.status} />
            </div>
          </CardHeader>
          {debugData.issues && debugData.issues.length > 0 && (
            <CardContent>
              <Alert variant={debugData.status === "error" ? "destructive" : "default"}>
                <AlertDescription>
                  <div className="font-semibold mb-2">Issues Detected:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {debugData.issues.map((issue: string, i: number) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>

        {/* Recommendations */}
        {debugData.recommendations && debugData.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2">
                {debugData.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-sm">{rec}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Session Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Session Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Authenticated:</span>
                <Badge variant={debugData.session?.authenticated ? "default" : "secondary"}>
                  {debugData.session?.authenticated ? "Yes" : "No"}
                </Badge>
              </div>
              
              {debugData.session?.authenticated && (
                <>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">User ID:</span>
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                        {debugData.session.userId}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Email:</span>
                      <span>{debugData.session.email || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Name:</span>
                      <span>{debugData.session.name || "N/A"}</span>
                    </div>
                  </div>
                </>
              )}

              {debugData.session?.error && (
                <>
                  <Separator />
                  <Alert variant="destructive">
                    <AlertDescription className="text-xs">
                      {debugData.session.error}
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>

          {/* Database Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Connection:</span>
                <Badge variant={debugData.database?.connected ? "default" : "destructive"}>
                  {debugData.database?.connected ? "Connected" : "Failed"}
                </Badge>
              </div>

              {debugData.database?.connected && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <span className="text-slate-600">Latency:</span>
                    <span className="ml-2 font-mono">{debugData.database.latency}ms</span>
                  </div>
                </>
              )}

              {debugData.database?.error && (
                <>
                  <Separator />
                  <Alert variant="destructive">
                    <AlertDescription className="text-xs">
                      {debugData.database.error}
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {/* User in Database */}
              {debugData.user && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">User in DB:</span>
                    <Badge variant={debugData.user.exists ? "default" : "destructive"}>
                      {debugData.user.exists ? "Found" : "Not Found"}
                    </Badge>
                  </div>

                  {debugData.user.exists && debugData.user.user && (
                    <div className="text-xs space-y-1 text-slate-600">
                      <div>Accounts: {debugData.user.user.accountCount}</div>
                      <div>Trips: {debugData.user.user.stats?.trips || 0}</div>
                      <div>
                        Created: {new Date(debugData.user.user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {!debugData.user.exists && debugData.user.reason && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-xs">
                        {debugData.user.reason}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Environment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Environment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">AUTH_SECRET:</span>
                  <Badge variant={debugData.environment?.hasAuthSecret ? "default" : "destructive"}>
                    {debugData.environment?.hasAuthSecret ? "Set" : "Missing"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">DATABASE_URL:</span>
                  <Badge variant={debugData.environment?.hasDatabaseUrl ? "default" : "destructive"}>
                    {debugData.environment?.hasDatabaseUrl ? "Set" : "Missing"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Environment:</span>
                  <Badge variant="secondary">{debugData.environment?.nodeEnv}</Badge>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium mb-2">Configured Providers:</div>
                <div className="flex flex-wrap gap-2">
                  {debugData.environment?.configuredProviders?.length > 0 ? (
                    debugData.environment.configuredProviders.map((provider: string) => (
                      <Badge key={provider} variant="outline">
                        {provider}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No providers configured</span>
                  )}
                </div>
              </div>

              {debugData.environment?.validation?.errors?.length > 0 && (
                <>
                  <Separator />
                  <Alert variant="destructive">
                    <AlertDescription>
                      <div className="text-xs space-y-1">
                        {debugData.environment.validation.errors.map((error: any, i: number) => (
                          <div key={i}>• {error.message}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>

          {/* Cookie Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="w-5 h-5" />
                Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Auth Cookies:</span>
                  <Badge variant="secondary">{debugData.cookies?.count || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Session Token:</span>
                  <Badge variant={debugData.cookies?.hasSessionToken ? "default" : "secondary"}>
                    {debugData.cookies?.hasSessionToken ? "Present" : "Missing"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">CSRF Token:</span>
                  <Badge variant={debugData.cookies?.hasCsrfToken ? "default" : "secondary"}>
                    {debugData.cookies?.hasCsrfToken ? "Present" : "Missing"}
                  </Badge>
                </div>
              </div>

              {debugData.cookies?.oldCookiesDetected && (
                <>
                  <Separator />
                  <Alert variant="destructive">
                    <AlertDescription className="text-xs">
                      <div className="font-semibold mb-1">Old cookies detected!</div>
                      {debugData.cookies.oldCookiesReason}
                    </AlertDescription>
                  </Alert>
                </>
              )}

              <Separator />

              <ClearAuthCookiesButton />

              {debugData.cookies?.cookies && debugData.cookies.cookies.length > 0 && (
                <>
                  <Separator />
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">
                      View Cookie Details
                    </summary>
                    <div className="mt-2 space-y-1 text-slate-600">
                      {debugData.cookies.cookies.map((cookie: any, i: number) => (
                        <div key={i} className="font-mono">
                          {cookie.name}: {cookie.size} bytes
                        </div>
                      ))}
                    </div>
                  </details>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Linked Accounts */}
        {debugData.user?.exists && debugData.user.user?.accounts && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Linked Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {debugData.user.user.accounts.map((account: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{account.provider}</Badge>
                      {account.isPrimary && (
                        <Badge variant="default">Primary</Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-600">
                      {account.lastLogin
                        ? `Last login: ${new Date(account.lastLogin).toLocaleDateString()}`
                        : "Never logged in"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Raw Debug Data */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Debug Data</CardTitle>
            <CardDescription>Complete validation response (for developers)</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
