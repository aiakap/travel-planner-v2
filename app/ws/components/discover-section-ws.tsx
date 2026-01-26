"use client";

import { Button } from "@/app/ws/ui/button";
import { MapPin, Calendar, Users, Star, ArrowRight } from "lucide-react";

const featuredTrips = [
  {
    id: 1,
    title: "Ancient Temples of Kyoto",
    location: "Kyoto, Japan",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=400&fit=crop",
    dates: "Mar 15 - Mar 24, 2026",
    spotsLeft: 4,
    totalSpots: 12,
    price: "$3,200",
    rating: 4.9,
    reviews: 128,
    guide: {
      name: "Yuki Tanaka",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      verified: true,
    },
  },
  {
    id: 2,
    title: "Patagonia Wilderness Trek",
    location: "Torres del Paine, Chile",
    image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&h=400&fit=crop",
    dates: "Apr 5 - Apr 14, 2026",
    spotsLeft: 2,
    totalSpots: 8,
    price: "$4,500",
    rating: 5.0,
    reviews: 87,
    guide: {
      name: "Carlos Mendez",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      verified: true,
    },
  },
  {
    id: 3,
    title: "Moroccan Desert & Medinas",
    location: "Marrakech to Sahara",
    image: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=600&h=400&fit=crop",
    dates: "Feb 20 - Mar 1, 2026",
    spotsLeft: 6,
    totalSpots: 10,
    price: "$2,800",
    rating: 4.8,
    reviews: 203,
    guide: {
      name: "Fatima El-Kadi",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      verified: true,
    },
  },
  {
    id: 4,
    title: "Northern Lights Adventure",
    location: "Tromsø, Norway",
    image: "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=600&h=400&fit=crop",
    dates: "Jan 28 - Feb 4, 2026",
    spotsLeft: 3,
    totalSpots: 6,
    price: "$3,900",
    rating: 4.9,
    reviews: 156,
    guide: {
      name: "Erik Larsen",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      verified: true,
    },
  },
];

const categories = [
  { label: "All Trips", active: true },
  { label: "Adventure", active: false },
  { label: "Cultural", active: false },
  { label: "Wellness", active: false },
  { label: "Food & Wine", active: false },
  { label: "Photography", active: false },
];

export function DiscoverSection() {
  return (
    <section id="discover" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            Discover Upcoming Trips
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join curated group experiences led by verified local guides and passionate creators. 
            Every trip includes your AI companion and 24/7 support.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.label}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                cat.active
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground border border-border hover:bg-muted"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {featuredTrips.map((trip) => (
            <div
              key={trip.id}
              className="bg-background rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow group"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={trip.image || "/placeholder.svg"}
                  alt={trip.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-medium">{trip.rating}</span>
                  <span className="text-xs text-muted-foreground">({trip.reviews})</span>
                </div>
                <div className="absolute bottom-3 right-3">
                  <div className="relative">
                    <img
                      src={trip.guide.image || "/placeholder.svg"}
                      alt={trip.guide.name}
                      className="w-10 h-10 rounded-full border-2 border-background object-cover"
                    />
                    {trip.guide.verified && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                  {trip.title}
                </h3>
                <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                  <MapPin className="w-3 h-3" />
                  <span>{trip.location}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{trip.dates}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-semibold text-foreground">{trip.price}</span>
                    <span className="text-xs text-muted-foreground"> / person</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-amber-600 font-medium">{trip.spotsLeft} spots left</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" className="gap-2 bg-transparent">
            Browse All Trips
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
