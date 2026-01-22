import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowLeft, Home, Database } from "lucide-react";
import { ClearCookiesButton, CopyErrorButton } from "./error-actions";

interface LoginErrorPageProps {
  searchParams: Promise<{
    error?: string;
    details?: string;
  }>;
}

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Configuration Error",
    description: "There is a problem with the server configuration. Please contact support.",
  },
  AccessDenied: {
    title: "Access Denied",
    description: "You do not have permission to sign in. This could be because you cancelled the login or the authentication provider denied access.",
  },
  Verification: {
    title: "Verification Error",
    description: "The verification token has expired or has already been used.",
  },
  OAuthSignin: {
    title: "OAuth Sign In Error",
    description: "Error occurred during the OAuth sign in process. Please try again.",
  },
  OAuthCallback: {
    title: "OAuth Callback Error",
    description: "Error occurred during the OAuth callback. Please try again.",
  },
  OAuthCreateAccount: {
    title: "OAuth Account Creation Error",
    description: "Could not create OAuth account. Please try again or use a different provider.",
  },
  EmailCreateAccount: {
    title: "Email Account Creation Error",
    description: "Could not create email account. Please try again.",
  },
  Callback: {
    title: "Callback Error",
    description: "Error occurred during callback. Please try again.",
  },
  OAuthAccountNotLinked: {
    title: "Account Not Linked",
    description: "This account is already linked to another user. Please sign in with your original account first.",
  },
  EmailSignin: {
    title: "Email Sign In Error",
    description: "Error occurred sending the email. Please try again.",
  },
  CredentialsSignin: {
    title: "Sign In Error",
    description: "Sign in failed. Check your credentials and try again.",
  },
  SessionRequired: {
    title: "Session Required",
    description: "You must be signed in to access this page.",
  },
  SessionTokenError: {
    title: "Session Token Error",
    description: "Your session token is invalid or expired. This usually happens when AUTH_SECRET is missing or cookies are from an old system.",
  },
  DatabaseError: {
    title: "Database Error",
    description: "Unable to connect to the database. Please check your DATABASE_URL configuration.",
  },
  ConfigurationError: {
    title: "Configuration Error",
    description: "The authentication system is not properly configured. Please check your environment variables.",
  },
  Default: {
    title: "Authentication Error",
    description: "An error occurred during authentication. Please try again.",
  },
};

export default async function LoginErrorPage({ searchParams }: LoginErrorPageProps) {
  const params = await searchParams;
  const error = params.error || "Default";
  const details = params.details;
  
  // CAPTURE ALL QUERY PARAMS FOR DEBUGGING
  const allParams = JSON.stringify(params, null, 2);
  console.log("=== ERROR PAGE ===");
  console.log("All query params:", allParams);
  console.log("Error:", error);
  console.log("Details:", details);
  console.log("=== ERROR PAGE END ===");
  
  const errorInfo = errorMessages[error] || errorMessages.Default;

  // Determine if this is a critical error requiring immediate action
  const isCritical = ["SessionTokenError", "DatabaseError", "ConfigurationError"].includes(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-8">
      <div className="w-full max-w-2xl space-y-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl">{errorInfo.title}</CardTitle>
            <CardDescription>Something went wrong during sign in</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorInfo.description}</AlertDescription>
            </Alert>

            {details && (
              <Alert>
                <AlertDescription>
                  <div className="font-semibold mb-1">Additional Details:</div>
                  <div className="text-sm">{details}</div>
                </AlertDescription>
              </Alert>
            )}

            {/* Error-specific troubleshooting */}
            {error === "AccessDenied" && (
              <div className="text-sm text-slate-600 space-y-2">
                <p className="font-medium">Common reasons for access denied:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>You clicked "Cancel" during the OAuth flow</li>
                  <li>You denied permission to the application</li>
                  <li>Your account doesn't have the required permissions</li>
                </ul>
              </div>
            )}

            {error === "SessionTokenError" && (
              <div className="space-y-3">
                <div className="text-sm text-slate-600 space-y-2">
                  <p className="font-medium">Quick Fix:</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-500">
                    <li>Add AUTH_SECRET to your .env file</li>
                    <li>Clear all browser cookies</li>
                    <li>Restart your development server</li>
                    <li>Try signing in again</li>
                  </ol>
                </div>
                <ClearCookiesButton />
              </div>
            )}

            {error === "DatabaseError" && (
              <div className="text-sm text-slate-600 space-y-2">
                <p className="font-medium">Database connection failed:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>Check DATABASE_URL in your .env file</li>
                  <li>Ensure your database server is running</li>
                  <li>Run: npx prisma db push</li>
                  <li>Check database credentials</li>
                </ul>
              </div>
            )}

            {error === "ConfigurationError" && (
              <div className="text-sm text-slate-600 space-y-2">
                <p className="font-medium">Configuration issues detected:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>Check all required environment variables</li>
                  <li>Verify OAuth provider credentials</li>
                  <li>Ensure AUTH_SECRET is set</li>
                  <li>Review the debug dashboard for details</li>
                </ul>
              </div>
            )}

            {error === "OAuthAccountNotLinked" && (
              <div className="text-sm text-slate-600 space-y-2">
                <p className="font-medium">Account linking issue:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>This email is already associated with another account</li>
                  <li>Sign in with your original provider first</li>
                  <li>Then link additional accounts from settings</li>
                </ul>
              </div>
            )}

            <Separator />

            <div className="flex flex-col gap-2">
              <Link href="/login">
                <Button className="w-full" variant="default">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </Link>
              
              {isCritical && (
                <Link href="/auth/debug">
                  <Button className="w-full" variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Open Debug Dashboard
                  </Button>
                </Link>
              )}
              
              <Link href="/">
                <Button className="w-full" variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
            </div>

            {/* Copy error details */}
            <Separator />
            
            <div className="space-y-2">
              <div className="text-xs text-slate-500 text-center">
                Error Code: <Badge variant="outline">{error}</Badge>
              </div>
              <CopyErrorButton error={error} details={details} />
            </div>
          </CardContent>
        </Card>

        {/* Environment Status (Development Only) */}
        {process.env.NODE_ENV === "development" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Development Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">AUTH_SECRET:</span>
                <Badge variant={process.env.AUTH_SECRET ? "default" : "destructive"}>
                  {process.env.AUTH_SECRET ? "Set" : "Missing"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">DATABASE_URL:</span>
                <Badge variant={process.env.DATABASE_URL ? "default" : "destructive"}>
                  {process.env.DATABASE_URL ? "Set" : "Missing"}
                </Badge>
              </div>
              <Separator />
              <Link href="/auth/debug">
                <Button variant="outline" size="sm" className="w-full">
                  View Full Debug Info
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* DEBUG: Show all query parameters in development */}
        {process.env.NODE_ENV === "development" && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">Debug Information</CardTitle>
              <CardDescription>All query parameters received</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-white p-4 rounded border overflow-auto max-h-96">
                {allParams}
              </pre>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-sm text-slate-500">
          <p>Need help? Contact support or check our documentation.</p>
        </div>
      </div>
    </div>
  );
}
