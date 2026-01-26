"use client";

import { Button } from "@/app/ws/ui/button";
import {
  Globe,
  DollarSign,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Instagram,
  Youtube,
  Play,
} from "lucide-react";

const benefits = [
  {
    icon: Globe,
    title: "Custom Trip Website",
    description: "Get a branded trip page with your own URL to share with your audience.",
    color: "bg-teal-500",
  },
  {
    icon: DollarSign,
    title: "Keep Your Earnings",
    description: "Set your own prices and keep the majority of what you earn as a guide.",
    color: "bg-emerald-500",
  },
  {
    icon: Users,
    title: "Build Community",
    description: "Turn followers into travel companions. Create lasting connections.",
    color: "bg-rose-500",
  },
  {
    icon: Sparkles,
    title: "AI Trip Planning",
    description: "Our AI handles itinerary creation, logistics, and traveler questions.",
    color: "bg-amber-500",
  },
];

const creatorTypes = [
  {
    title: "Influencers & Content Creators",
    description: "Take your audience on exclusive trips they can't get anywhere else.",
    icon: Instagram,
    features: [
      "Branded trip landing pages",
      "Built-in waitlist management",
      "Content-ready experiences",
      "Audience payment handling",
    ],
  },
  {
    title: "Local Experts & Guides",
    description: "Monetize your local knowledge and share hidden gems with travelers.",
    icon: Globe,
    features: [
      "Certification & verification",
      "Flexible scheduling",
      "Insurance coverage",
      "Direct booking system",
    ],
  },
  {
    title: "Group Organizers",
    description: "Plan trips for friends, clubs, or communities with professional tools.",
    icon: Users,
    features: [
      "Group payment splitting",
      "RSVP & attendance tracking",
      "Shared trip planning",
      "Communication hub",
    ],
  },
];

const featuredCreators = [
  {
    name: "Maya Chen",
    handle: "@mayatravels",
    followers: "2.1M",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    platform: Instagram,
    trips: 24,
    travelers: 312,
  },
  {
    name: "James Wu",
    handle: "@jameswuadventures",
    followers: "850K",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    platform: Youtube,
    trips: 18,
    travelers: 198,
  },
  {
    name: "Sofia Rodriguez",
    handle: "@sofiaexplores",
    followers: "1.5M",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    platform: Instagram,
    trips: 31,
    travelers: 428,
  },
];

export function CreatorsSection() {
  return (
    <section id="creators" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <span className="text-sm font-medium text-primary mb-4 block">
              For Creators & Guides
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
              Turn Your Passion into Paid Experiences
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Whether you're an influencer with millions of followers or a local expert 
              with insider knowledge, Ntourage gives you everything you need to create, 
              promote, and lead unforgettable group experiences.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-3">
                  <div
                    className={`${benefit.color} w-10 h-10 rounded-lg flex items-center justify-center shrink-0`}
                  >
                    <benefit.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm">
                      {benefit.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="gap-2">
                Start Creating
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Play className="w-4 h-4" />
                Watch How It Works
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="bg-muted/50 rounded-2xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Creator Dashboard Preview</p>
                  <p className="text-sm text-muted-foreground">Your earnings this month</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-2xl font-semibold text-foreground">$12,450</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-2xl font-semibold text-foreground">156</p>
                  <p className="text-xs text-muted-foreground">Travelers</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-2xl font-semibold text-foreground">4.9</p>
                  <p className="text-xs text-muted-foreground">Avg Rating</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Active Trips</p>
                {[
                  { name: "Bali Wellness Retreat", travelers: 8, status: "Filling" },
                  { name: "Tokyo Food Tour", travelers: 12, status: "Full" },
                ].map((trip) => (
                  <div
                    key={trip.name}
                    className="flex items-center justify-between bg-background rounded-lg p-3 border border-border"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{trip.name}</p>
                      <p className="text-xs text-muted-foreground">{trip.travelers} travelers</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        trip.status === "Full"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {trip.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-20">
          <h3 className="font-serif text-2xl text-foreground text-center mb-10">
            Built for Every Kind of Creator
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {creatorTypes.map((type) => (
              <div
                key={type.title}
                className="bg-background rounded-xl border border-border p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <type.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">{type.title}</h4>
                <p className="text-sm text-muted-foreground mb-4">{type.description}</p>
                <ul className="space-y-2">
                  {type.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-serif text-2xl text-foreground text-center mb-3">
            Creators Already on Ntourage
          </h3>
          <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">
            Join thousands of creators who are building thriving travel businesses.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredCreators.map((creator) => (
              <div
                key={creator.handle}
                className="bg-background rounded-xl border border-border p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <img
                    src={creator.image || "/placeholder.svg"}
                    alt={creator.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-background rounded-full flex items-center justify-center border border-border">
                    <creator.platform className="w-4 h-4 text-foreground" />
                  </div>
                </div>
                <h4 className="font-semibold text-foreground">{creator.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">{creator.handle}</p>
                <p className="text-xs text-muted-foreground mb-4">{creator.followers} followers</p>
                <div className="flex items-center justify-center gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{creator.trips}</p>
                    <p className="text-xs text-muted-foreground">Trips</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">{creator.travelers}</p>
                    <p className="text-xs text-muted-foreground">Travelers</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
