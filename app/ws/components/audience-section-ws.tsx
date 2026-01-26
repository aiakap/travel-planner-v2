"use client";

import { Card, CardContent } from "@/app/ws/ui/card";
import { Button } from "@/app/ws/ui/button";
import {
  User,
  Users,
  BadgeCheck,
  Megaphone,
  ArrowRight,
} from "lucide-react";

const audiences = [
  {
    id: "solo",
    icon: User,
    title: "Solo Travelers",
    subtitle: "Your personal adventure awaits",
    description:
      "Plan your dream trip with AI-powered recommendations. Get a custom itinerary, shareable trip website, and an AI companion that knows every detail of your journey.",
    features: [
      "Personalized AI trip planning",
      "Custom trip website & itinerary",
      "AI companion for on-the-go help",
      "Connect with local providers instantly",
    ],
    cta: "Plan My Solo Trip",
    iconBg: "bg-accent",
  },
  {
    id: "groups",
    icon: Users,
    title: "Group Organizers",
    subtitle: "Bring your crew together",
    description:
      "Coordinate group adventures effortlessly. Share itineraries, manage RSVPs, split costs, and keep everyone on the same page with a dedicated trip hub.",
    features: [
      "Shared trip dashboard",
      "RSVP & payment management",
      "Group chat & coordination",
      "Know who's coming with verified profiles",
    ],
    cta: "Organize a Group Trip",
    iconBg: "bg-emerald-500",
  },
  {
    id: "guides",
    icon: BadgeCheck,
    title: "Trip Leaders & Guides",
    subtitle: "Turn your passion into income",
    description:
      "Lead curated trips and get paid for your expertise. Build your reputation with verified reviews, background checks, and a professional trip profile.",
    features: [
      "Set your rates & earnings",
      "Verified guide certification",
      "Trip management dashboard",
      "Build your reputation & reviews",
    ],
    cta: "Become a Guide",
    iconBg: "bg-rose-400",
  },
  {
    id: "influencers",
    icon: Megaphone,
    title: "Creators & Influencers",
    subtitle: "Take your audience on an adventure",
    description:
      "Create exclusive trips for your community. Branded trip websites, seamless booking, and full support so you can focus on creating memorable experiences.",
    features: [
      "Branded trip experience",
      "Audience booking portal",
      "Revenue & commission tools",
      "Full concierge support",
    ],
    cta: "Create a Trip",
    iconBg: "bg-amber-500",
  },
];

export function AudienceSection() {
  return (
    <section className="py-20 bg-background" id="audiences">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-3">
            Built for Every Traveler
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Whether you're exploring solo, organizing friends, leading tours, or
            bringing your audience along—we've got you covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {audiences.map((audience) => {
            const Icon = audience.icon;
            return (
              <Card
                key={audience.id}
                id={audience.id}
                className="bg-card border border-border hover:shadow-lg transition-all duration-300 group"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-5">
                    <div
                      className={`p-3 rounded-lg ${audience.iconBg}`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">
                        {audience.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {audience.subtitle}
                      </p>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
                    {audience.description}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {audience.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-3 text-sm text-foreground"
                      >
                        <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant="outline"
                    className="w-full border-border text-foreground hover:bg-secondary bg-transparent"
                  >
                    {audience.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
