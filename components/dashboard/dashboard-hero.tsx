"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, MapPin, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

interface Trip {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  imageUrl: string | null;
  segments: Array<{
    startTitle: string;
    endTitle: string;
  }>;
}

interface DashboardHeroProps {
  upcomingTrips: Trip[];
  userName: string;
}

// Helper function to generate trip image based on trip info
function getTripImageUrl(trip: Trip): string {
  if (trip.imageUrl) return trip.imageUrl;
  
  // Extract destination from first segment or title
  const destination = trip.segments[0]?.startTitle.split(",")[0] || trip.title;
  
  // Use Unsplash for dynamic travel images based on destination
  const query = encodeURIComponent(destination + " travel");
  return `https://source.unsplash.com/1600x900/?${query}`;
}

export function DashboardHero({ upcomingTrips, userName }: DashboardHeroProps) {
  const [currentTripIndex, setCurrentTripIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
  } | null>(null);

  const currentTrip = upcomingTrips[currentTripIndex];
  const nextTrip = upcomingTrips[0]; // Always use first trip for countdown

  // Auto-rotate through trips
  useEffect(() => {
    if (upcomingTrips.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentTripIndex((prev) => (prev + 1) % upcomingTrips.length);
    }, 6000); // Change every 6 seconds

    return () => clearInterval(interval);
  }, [upcomingTrips.length]);

  // Calculate countdown for the next upcoming trip
  useEffect(() => {
    if (!nextTrip) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const tripDate = new Date(nextTrip.startDate);
      const difference = tripDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
        });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [nextTrip]);

  const handlePrevTrip = () => {
    setCurrentTripIndex((prev) => 
      prev === 0 ? upcomingTrips.length - 1 : prev - 1
    );
  };

  const handleNextTrip = () => {
    setCurrentTripIndex((prev) => (prev + 1) % upcomingTrips.length);
  };

  // No upcoming trip - inspirational hero
  if (upcomingTrips.length === 0 || !currentTrip) {
    return (
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <Image
          src="/luxury-hotel-room.png"
          alt="Plan Your Next Journey"
          fill
          className="object-cover"
          priority
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--hero-overlay)" }}
        />
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 leading-tight">
                Welcome back, {userName}
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-6">
                Your next extraordinary experience awaits
              </p>
              <Link href="/trips/new">
                <Button
                  size="lg"
                  className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 text-base px-6 py-3 rounded-lg font-medium shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                >
                  Plan Your Next Journey
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Has upcoming trips - carousel hero
  const destinations = currentTrip.segments
    .map((s) => s.startTitle)
    .filter((title, index, arr) => arr.indexOf(title) === index)
    .slice(0, 3)
    .join(", ");

  const isNextTrip = currentTripIndex === 0;

  return (
    <section className="relative h-[55vh] min-h-[450px] overflow-hidden group">
      {/* Background Image with transition */}
      <div className="absolute inset-0 transition-opacity duration-1000">
        <Image
          key={currentTrip.id}
          src={getTripImageUrl(currentTrip)}
          alt={currentTrip.title}
          fill
          className="object-cover"
          priority
        />
      </div>
      
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7))",
        }}
      />

      {/* Navigation Arrows */}
      {upcomingTrips.length > 1 && (
        <>
          <button
            onClick={handlePrevTrip}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full border border-white/30 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Previous trip"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={handleNextTrip}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full border border-white/30 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Next trip"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Carousel Indicators */}
      {upcomingTrips.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {upcomingTrips.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTripIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentTripIndex
                  ? "w-8 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to trip ${index + 1}`}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="inline-block mb-3">
              <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border border-white/30">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                {isNextTrip ? "Next Adventure" : `Upcoming Trip ${currentTripIndex + 1} of ${upcomingTrips.length}`}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-3 leading-tight">
              {currentTrip.title}
            </h1>
            {destinations && (
              <div className="flex items-center gap-2 text-base sm:text-lg md:text-xl text-white/90 mb-4">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{destinations}</span>
              </div>
            )}

            {/* Show countdown only for the next trip */}
            {isNextTrip && timeLeft && (
              <div className="mb-6">
                <div className="flex items-baseline gap-2 sm:gap-4 mb-2">
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                      {timeLeft.days}
                    </div>
                    <div className="text-xs text-white/80 uppercase tracking-wide">
                      Days
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl text-white/60 font-light">:</div>
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                      {timeLeft.hours}
                    </div>
                    <div className="text-xs text-white/80 uppercase tracking-wide">
                      Hours
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl text-white/60 font-light">:</div>
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                      {timeLeft.minutes}
                    </div>
                    <div className="text-xs text-white/80 uppercase tracking-wide">
                      Min
                    </div>
                  </div>
                </div>
                <p className="text-white/70 text-sm sm:text-base">
                  Departing{" "}
                  {new Date(nextTrip.startDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}

            {/* Show trip date for non-next trips */}
            {!isNextTrip && (
              <p className="text-white/80 text-sm sm:text-base mb-6">
                {new Date(currentTrip.startDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                –{" "}
                {new Date(currentTrip.endDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={`/trips/${currentTrip.id}`}>
                <Button
                  size="default"
                  className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-6 py-2 rounded-lg font-medium shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                >
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href={`/trips/${currentTrip.id}/edit`}>
                <Button
                  size="default"
                  variant="outline"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 px-6 py-2 rounded-lg font-medium border border-white/30"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
