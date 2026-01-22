/**
 * Returning User Page
 * Shown to users who successfully log in
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, MessageCircle, User, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function ReturningUserPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user details with stats
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      accounts: {
        select: {
          provider: true,
          lastLoginAt: true,
        },
        orderBy: {
          lastLoginAt: "desc",
        },
      },
      _count: {
        select: {
          trips: true,
          conversations: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/user-not-found");
  }

  // Get upcoming trips
  const upcomingTrips = await prisma.trip.findMany({
    where: {
      userId: user.id,
      startDate: {
        gte: new Date(),
      },
    },
    orderBy: {
      startDate: "asc",
    },
    take: 3,
  });

  const firstName = user.name?.split(" ")[0] || "Traveler";
  const lastLogin = user.accounts[0]?.lastLoginAt;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full space-y-8">
        {/* Welcome Back Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <User className="w-10 h-10 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-4xl font-bold">Welcome back, {firstName}! 👋</h1>
          <p className="text-lg text-slate-600">
            Ready to continue planning your adventures?
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{user._count.trips}</div>
              <div className="text-sm text-slate-600 mt-1">Trips</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{upcomingTrips.length}</div>
              <div className="text-sm text-slate-600 mt-1">Upcoming</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{user.accounts.length}</div>
              <div className="text-sm text-slate-600 mt-1">Accounts</div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Trips */}
        {upcomingTrips.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Trips
              </CardTitle>
              <CardDescription>Your next adventures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingTrips.map((trip) => (
                <Link key={trip.id} href={`/trips/${trip.id}`}>
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      {trip.imageUrl ? (
                        <img
                          src={trip.imageUrl}
                          alt={trip.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-200 rounded flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-slate-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{trip.title}</div>
                        <div className="text-sm text-slate-600">
                          {new Date(trip.startDate).toLocaleDateString()} -{" "}
                          {new Date(trip.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>What would you like to do?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/trips/new">
              <Button className="w-full justify-start" variant="outline" size="lg">
                <MapPin className="w-4 h-4 mr-2" />
                Plan a New Trip
              </Button>
            </Link>
            <Link href="/manage">
              <Button className="w-full justify-start" variant="outline" size="lg">
                <Calendar className="w-4 h-4 mr-2" />
                View All Trips
              </Button>
            </Link>
            <Link href="/test/profile-suggestions">
              <Button className="w-full justify-start" variant="outline" size="lg">
                <MessageCircle className="w-4 h-4 mr-2" />
                Get AI Trip Suggestions
              </Button>
            </Link>
            <Link href="/profile">
              <Button className="w-full justify-start" variant="outline" size="lg">
                <User className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Email:</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Member since:</span>
              <span className="font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            {lastLogin && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Last login:</span>
                <span className="font-medium">
                  {new Date(lastLogin).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Linked accounts:</span>
              <div className="flex gap-2">
                {user.accounts.map((account) => (
                  <Badge key={account.provider} variant="outline" className="capitalize">
                    {account.provider}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Link href="/">
            <Button size="lg" className="px-8">
              Continue to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
