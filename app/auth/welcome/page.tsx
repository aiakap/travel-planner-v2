/**
 * New User Welcome Page
 * Shown to first-time users after successful sign up
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles, MapPin, User, Calendar } from "lucide-react";
import Link from "next/link";

export default async function WelcomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      accounts: {
        select: {
          provider: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/user-not-found");
  }

  const primaryAccount = user.accounts[0];
  const firstName = user.name?.split(" ")[0] || "Traveler";

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">Welcome to Bespoke, {firstName}! 🎉</h1>
          <p className="text-lg text-slate-600">
            Your account has been created successfully. Let's get you started on your travel journey.
          </p>
        </div>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Account Created
            </CardTitle>
            <CardDescription>
              You signed up with {primaryAccount?.provider}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-600" />
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-slate-600">{user.email}</div>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">
                {primaryAccount?.provider}
              </Badge>
            </div>

            <div className="text-xs text-slate-500 text-center">
              Account created: {new Date(user.createdAt).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Here's what you can do with Bespoke
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium">Plan Your First Trip</div>
                  <div className="text-sm text-slate-600">
                    Create a trip and let AI help you plan the perfect itinerary
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <User className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium">Complete Your Profile</div>
                  <div className="text-sm text-slate-600">
                    Tell us about your travel preferences for personalized recommendations
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium">Explore AI Suggestions</div>
                  <div className="text-sm text-slate-600">
                    Get personalized trip ideas based on your interests
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Link href="/trips/new">
                <Button className="w-full" size="lg">
                  <MapPin className="w-4 h-4 mr-2" />
                  Create Your First Trip
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" className="w-full">
                  <User className="w-4 h-4 mr-2" />
                  Complete Profile
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === "development" && (
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer">Debug Information</summary>
            <pre className="mt-2 bg-slate-900 text-slate-100 p-3 rounded overflow-auto">
              {JSON.stringify(
                {
                  userId: user.id,
                  email: user.email,
                  provider: primaryAccount?.provider,
                  accountCount: user.accounts.length,
                },
                null,
                2
              )}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
