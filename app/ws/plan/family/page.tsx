import { auth } from "@/auth";


import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import {
  Heart,
  Baby,
  Users,
  Calendar,
  Sparkles,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Utensils,
  Bed,
  Car,
} from "lucide-react";
import Link from "next/link";

const benefits = [
  {
    icon: Baby,
    title: "Kid-Friendly Planning",
    description:
      "Age-appropriate activities, nap time scheduling, and family-friendly restaurants.",
  },
  {
    icon: Calendar,
    title: "Flexible Scheduling",
    description:
      "Build in downtime, adjust on the fly, and keep everyone happy with realistic pacing.",
  },
  {
    icon: Users,
    title: "Multi-Generational",
    description:
      "Activities that work for grandparents, parents, teens, and toddlers alike.",
  },
  {
    icon: Shield,
    title: "Safety First",
    description:
      "Kid-safe accommodations, medical facilities nearby, and emergency support 24/7.",
  },
];

const familyFeatures = [
  {
    icon: MapPin,
    title: "Family Activities",
    items: [
      "Theme parks & attractions",
      "Interactive museums",
      "Beach & nature spots",
      "Kid-friendly tours",
    ],
  },
  {
    icon: Utensils,
    title: "Dining Made Easy",
    items: [
      "High chair availability",
      "Kids menus & allergen info",
      "Early dinner reservations",
      "Grocery delivery options",
    ],
  },
  {
    icon: Bed,
    title: "Family Accommodations",
    items: [
      "Cribs & extra beds",
      "Kitchen facilities",
      "Pool & play areas",
      "Connecting rooms",
    ],
  },
  {
    icon: Car,
    title: "Transportation",
    items: [
      "Car seat rentals",
      "Family-friendly transfers",
      "Stroller recommendations",
      "Rest stop planning",
    ],
  },
];

export default async function FamilyTripPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/ws/plan"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back to Trip Types
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 mb-6">
              <Heart className="h-4 w-4 text-rose-500" />
              <span className="text-sm text-rose-500 font-medium">
                Family Travel
              </span>
            </div>

            <h1 className="font-serif text-4xl md:text-6xl text-foreground mb-6 text-balance">
              Family Adventures Made Simple
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              Plan trips that work for everyone — from toddlers to grandparents.
              Kid-friendly activities, realistic scheduling, and support when
              things don't go as planned.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-rose-500 text-white hover:bg-rose-600 text-lg px-8"
              >
                Start Planning
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border text-foreground hover:bg-muted bg-transparent"
              >
                View Sample Itinerary
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Built for Family Travel
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every feature designed with families in mind.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit) => (
              <Card
                key={benefit.title}
                className="bg-card border border-border"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-rose-500 flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Family Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Everything Families Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI considers every detail so you don't have to stress.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {familyFeatures.map((feature) => (
              <Card
                key={feature.title}
                className="bg-card border border-border"
              >
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5 text-rose-500" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <ul className="space-y-2">
                    {feature.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="h-3 w-3 text-rose-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Invite Feature for Families */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-5">
                Everyone Gets Their Own Itinerary
              </h2>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                Grandma flying in for just the beach days? Teen cousin joining
                for the theme parks? Each family member sees only what's
                relevant to them, while you see the big picture.
              </p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-rose-500 mt-0.5" />
                  <span className="text-foreground">
                    Different schedules for different family members
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-rose-500 mt-0.5" />
                  <span className="text-foreground">
                    Kids' activities highlighted in their view
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-rose-500 mt-0.5" />
                  <span className="text-foreground">
                    Share specific details with babysitters or helpers
                  </span>
                </li>
              </ul>

              <Button className="bg-rose-500 text-white hover:bg-rose-600">
                Start Your Family Trip
              </Button>
            </div>

            <Card className="bg-card border border-border">
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4">
                  Family Trip: Hawaii
                </h4>

                <div className="space-y-3">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white text-xs font-medium">
                        M
                      </div>
                      <span className="font-medium text-foreground text-sm">
                        Mom & Dad
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Full trip: Mar 15-25 (10 days)
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-medium">
                        K
                      </div>
                      <span className="font-medium text-foreground text-sm">
                        Kids (Emma & Jake)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Full trip: Mar 15-25 (10 days)
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                        G
                      </div>
                      <span className="font-medium text-foreground text-sm">
                        Grandma
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Joining: Mar 18-22 (beach days only)
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-medium">
                        C
                      </div>
                      <span className="font-medium text-foreground text-sm">
                        Cousin Tyler
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Joining: Mar 20-25 (volcano & adventure)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-rose-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
            Ready for a Family Adventure?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Start planning your perfect family trip today. It's free to begin.
          </p>
          <Button
            size="lg"
            className="bg-white text-rose-500 hover:bg-white/90 text-lg px-8"
          >
            Plan Our Family Trip
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
