"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Search, 
  MousePointer, 
  Clock, 
  Trash2,
  LogIn,
  Sparkles,
} from "lucide-react";
import {
  getAnonymousActivity,
  clearAnonymousActivity,
  getSessionDuration,
  detectLocation,
  type AnonymousActivity,
} from "@/lib/anonymous-tracking";
import { useRouter } from "next/navigation";

export function ActivitySidePanel() {
  const [activity, setActivity] = useState<AnonymousActivity | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Initial load
    const loadedActivity = getAnonymousActivity();
    setActivity(loadedActivity);
    setSessionDuration(getSessionDuration());

    // Detect location if not already set
    if (!loadedActivity.location.city) {
      detectLocation().then(() => {
        setActivity(getAnonymousActivity());
      });
    }

    // Update session duration every minute
    const interval = setInterval(() => {
      setActivity(getAnonymousActivity());
      setSessionDuration(getSessionDuration());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleClearActivity = () => {
    if (confirm("Are you sure you want to clear all session activity?")) {
      clearAnonymousActivity();
      setActivity(getAnonymousActivity());
      setSessionDuration(0);
    }
  };

  const handleLogin = () => {
    router.push("/login?callbackUrl=/test/place-pipeline");
  };

  if (!activity) return null;

  const hasLocation = activity.location.city || activity.location.country;
  const hasActivity = activity.searchQueries.length > 0 || activity.clickedPlaces.length > 0;

  return (
    <div className="w-80 h-screen sticky top-0 flex flex-col">
      <Card className="flex-1 flex flex-col border-l shadow-lg rounded-none">
        <CardHeader className="bg-gradient-to-br from-blue-50 to-purple-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Session Activity
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Your browsing activity this session
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Session Duration */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Active for {sessionDuration} {sessionDuration === 1 ? "minute" : "minutes"}</span>
          </div>

          <Separator />

          {/* Location */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm">Location</h3>
            </div>
            {hasLocation ? (
              <div className="pl-6 text-sm text-muted-foreground">
                {activity.location.city && <div>{activity.location.city}</div>}
                {activity.location.region && <div>{activity.location.region}</div>}
                {activity.location.country && <div>{activity.location.country}</div>}
              </div>
            ) : (
              <div className="pl-6 text-sm text-muted-foreground italic">
                Detecting location...
              </div>
            )}
          </div>

          <Separator />

          {/* Recent Searches */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">Recent Searches</h3>
              <Badge variant="secondary" className="ml-auto text-xs">
                {activity.searchQueries.length}
              </Badge>
            </div>
            {activity.searchQueries.length > 0 ? (
              <div className="pl-6 space-y-1.5">
                {activity.searchQueries.slice(0, 5).map((search, idx) => (
                  <div key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-xs text-slate-400 mt-0.5">•</span>
                    <div className="flex-1">
                      <div className="line-clamp-2">{search.query}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(search.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {activity.searchQueries.length > 5 && (
                  <div className="text-xs text-muted-foreground italic pl-4">
                    +{activity.searchQueries.length - 5} more
                  </div>
                )}
              </div>
            ) : (
              <div className="pl-6 text-sm text-muted-foreground italic">
                No searches yet
              </div>
            )}
          </div>

          <Separator />

          {/* Clicked Places */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MousePointer className="h-4 w-4 text-purple-600" />
              <h3 className="font-semibold text-sm">Clicked Places</h3>
              <Badge variant="secondary" className="ml-auto text-xs">
                {activity.clickedPlaces.length}
              </Badge>
            </div>
            {activity.clickedPlaces.length > 0 ? (
              <div className="pl-6 space-y-1.5">
                {activity.clickedPlaces.slice(0, 8).map((place, idx) => (
                  <div key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-xs text-slate-400 mt-0.5">•</span>
                    <div className="flex-1">
                      <div className="line-clamp-1">{place.placeName}</div>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-xs py-0 px-1">
                          {place.category}
                        </Badge>
                        <span className="text-slate-400">
                          {new Date(place.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {activity.clickedPlaces.length > 8 && (
                  <div className="text-xs text-muted-foreground italic pl-4">
                    +{activity.clickedPlaces.length - 8} more
                  </div>
                )}
              </div>
            ) : (
              <div className="pl-6 text-sm text-muted-foreground italic">
                No places clicked yet
              </div>
            )}
          </div>

          {hasActivity && (
            <>
              <Separator />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearActivity}
                className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Clear All Activity
              </Button>
            </>
          )}
        </CardContent>

        {/* Login CTA */}
        <div className="border-t bg-gradient-to-br from-blue-50 to-purple-50 p-4">
          <div className="text-center space-y-3">
            <div className="text-sm font-medium text-slate-700">
              Want to save your activity?
            </div>
            <Button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="sm"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login to Save
            </Button>
            <p className="text-xs text-muted-foreground">
              Create trips and access your personalized profile
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
