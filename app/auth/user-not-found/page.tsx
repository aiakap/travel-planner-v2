/**
 * User Not Found Page
 * Shown when session exists but user is missing from database
 */

import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Database, User } from "lucide-react";
import Link from "next/link";
import { ClearCookiesAndRetryButton, ContactSupportButton } from "./user-not-found-actions";

export default async function UserNotFoundPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full space-y-6">
        {/* Error Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Account Not Found</h1>
          <p className="text-lg text-slate-600">
            We couldn't find your account in our database
          </p>
        </div>

        {/* Main Error Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-red-600" />
              Database Mismatch
            </CardTitle>
            <CardDescription>
              Your session is valid, but your user account is missing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">What happened?</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Your account may have been deleted</li>
                  <li>There may be a database synchronization issue</li>
                  <li>Your session cookies may be from an old system</li>
                </ul>
              </AlertDescription>
            </Alert>

            {session?.user && (
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="font-medium text-sm">Session Information:</div>
                <div className="space-y-1 text-sm">
                  {session.user.id && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">User ID:</span>
                      <code className="text-xs bg-white px-2 py-1 rounded">
                        {session.user.id}
                      </code>
                    </div>
                  )}
                  {session.user.email && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Email:</span>
                      <span>{session.user.email}</span>
                    </div>
                  )}
                  {session.user.name && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Name:</span>
                      <span>{session.user.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommended Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Actions</CardTitle>
            <CardDescription>Try these steps to resolve the issue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <div className="flex-1">
                  <div className="font-medium">Clear cookies and sign in again</div>
                  <div className="text-sm text-slate-600 mt-1">
                    This will clear your old session and create a new account
                  </div>
                  <ClearCookiesAndRetryButton />
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <div className="flex-1">
                  <div className="font-medium">Use incognito/private window</div>
                  <div className="text-sm text-slate-600 mt-1">
                    Open a private browsing window and try signing in there
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <div className="flex-1">
                  <div className="font-medium">Contact support</div>
                  <div className="text-sm text-slate-600 mt-1">
                    If the issue persists, reach out to our support team
                  </div>
                  <ContactSupportButton 
                    userId={session?.user?.id}
                    email={session?.user?.email || undefined}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Tools */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Tools</CardTitle>
            <CardDescription>For developers and troubleshooting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Link href="/auth/debug" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Database className="w-4 h-4 mr-2" />
                  Open Debug Dashboard
                </Button>
              </Link>
              <Link href="/login" className="flex-1">
                <Button variant="outline" className="w-full">
                  <User className="w-4 h-4 mr-2" />
                  Go to Login
                </Button>
              </Link>
            </div>

            {process.env.NODE_ENV === "development" && session && (
              <details className="text-xs">
                <summary className="cursor-pointer font-medium">
                  View Session Data
                </summary>
                <pre className="mt-2 bg-slate-900 text-slate-100 p-3 rounded overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>

        {/* Database Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                <div className="text-sm">
                  The database connection appears to be working, but your user record is missing.
                  This typically happens when:
                </div>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Your account was deleted</li>
                  <li>You're using cookies from a different environment</li>
                  <li>There was an error during account creation</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
