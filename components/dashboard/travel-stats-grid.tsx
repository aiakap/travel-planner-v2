"use client";

import { Compass, Globe2, MapPin, Plane } from "lucide-react";
import { calculateTimesAroundWorld } from "@/lib/utils";

interface TravelStats {
  totalTrips: number;
  countriesVisited: Set<string>;
  totalDistanceKm: number;
  upcomingTrips: number;
}

interface TravelStatsGridProps {
  stats: TravelStats;
}

export function TravelStatsGrid({ stats }: TravelStatsGridProps) {
  const timesAroundWorld = calculateTimesAroundWorld(stats.totalDistanceKm);

  const statCards = [
    {
      icon: Plane,
      label: "Trips Taken",
      value: stats.totalTrips.toString(),
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
    },
    {
      icon: MapPin,
      label: "Countries",
      value: stats.countriesVisited.size.toString(),
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-50 to-teal-50",
    },
    {
      icon: Globe2,
      label: "Distance",
      value: `${Math.round(stats.totalDistanceKm).toLocaleString()} km`,
      subtitle: timesAroundWorld >= 0.1 ? `${timesAroundWorld.toFixed(1)}x around Earth` : undefined,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
    },
    {
      icon: Compass,
      label: "Upcoming",
      value: stats.upcomingTrips.toString(),
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
            Your Travel Journey
          </h2>
          <p className="text-slate-600 text-lg">
            Adventures by the numbers
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 md:p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:scale-105"
              >
                {/* Gradient background on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>

                  {/* Value */}
                  <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-1 group-hover:text-slate-800 transition-colors">
                    {stat.value}
                  </div>

                  {/* Label */}
                  <div className="text-sm md:text-base text-slate-600 font-medium group-hover:text-slate-700 transition-colors">
                    {stat.label}
                  </div>

                  {/* Subtitle if exists */}
                  {stat.subtitle && (
                    <div className="text-xs text-slate-500 mt-1">
                      {stat.subtitle}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
