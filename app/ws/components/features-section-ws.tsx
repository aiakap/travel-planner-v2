"use client";

import { Card, CardContent } from "@/app/ws/ui/card";
import {
  Globe,
  Bot,
  Headphones,
  UserCheck,
  MapPin,
  Share2,
  MessageSquare,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Custom Trip Website",
    description:
      "Every trip gets its own beautiful, shareable website with all the details, itinerary, and booking info in one place.",
    iconBg: "bg-accent",
  },
  {
    icon: Bot,
    title: "AI Trip Companion",
    description:
      "Your free AI assistant knows every detail of your trip and can message local providers, make reservations, and answer questions 24/7.",
    iconBg: "bg-emerald-500",
  },
  {
    icon: Share2,
    title: "Shareable Itineraries",
    description:
      "Create stunning day-by-day itineraries that travelers can access, comment on, and export to their calendars.",
    iconBg: "bg-rose-400",
  },
  {
    icon: Headphones,
    title: "24/7 Remote Support Team",
    description:
      "A real human team that speaks your language and the local language—ready to help with calls, bookings, and anything electronic.",
    iconBg: "bg-amber-500",
  },
  {
    icon: MapPin,
    title: "Local Trip Concierges",
    description:
      "Add one or more local experts who know the area, speak the language, and can guide you through any situation on the ground.",
    iconBg: "bg-accent",
  },
  {
    icon: MessageSquare,
    title: "Direct Provider Messaging",
    description:
      "Your AI companion can reach out to hotels, restaurants, and tour operators on your behalf—no language barriers.",
    iconBg: "bg-emerald-500",
  },
  {
    icon: UserCheck,
    title: "Verified Profiles",
    description:
      "Optional background checks and ratings let you know exactly who's joining your trip, leading it, and supporting you.",
    iconBg: "bg-rose-400",
  },
  {
    icon: Shield,
    title: "Trust & Transparency",
    description:
      "See verified reviews, certifications, and trust scores for guides, concierges, and fellow travelers.",
    iconBg: "bg-amber-500",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-secondary/50" id="features">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-3">
            Everything You Need
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From planning to exploring, we've built the tools to make every trip
            seamless, safe, and unforgettable.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="bg-card border border-border hover:shadow-md transition-all duration-300"
              >
                <CardContent className="p-5">
                  <div className={`p-3 rounded-lg w-fit mb-4 ${feature.iconBg}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
