import { auth } from "@/auth";


import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import {
  User,
  Sparkles,
  Shield,
  Clock,
  MapPin,
  Camera,
  Coffee,
  Compass,
  CheckCircle2,
  ArrowRight,
  Bot,
  Globe,
} from "lucide-react";
import Link from "next/link";

const benefits = [
  {
    icon: Sparkles,
    title: "AI-Powered Recommendations",
    description:
      "Get personalized suggestions based on your interests, pace, and travel style.",
  },
  {
    icon: Shield,
    title: "Solo Safety Features",
    description:
      "Share your itinerary with trusted contacts and access 24/7 support anywhere.",
  },
  {
    icon: Clock,
    title: "Flexible Scheduling",
    description:
      "Change plans on the fly. Your AI companion adjusts recommendations in real-time.",
  },
  {
    icon: Bot,
    title: "Local Language Support",
    description:
      "Your AI drafts messages in local languages for restaurants, hotels, and services.",
  },
];

const experiences = [
  {
    icon: Camera,
    title: "Photography Tours",
    description: "Capture stunning moments with guided photo walks",
  },
  {
    icon: Coffee,
    title: "Culinary Adventures",
    description: "Discover local flavors and hidden food gems",
  },
  {
    icon: Compass,
    title: "Off-the-Path Exploration",
    description: "Find secret spots away from tourist crowds",
  },
  {
    icon: Globe,
    title: "Cultural Immersion",
    description: "Connect with locals and authentic experiences",
  },
];

export default async function SoloTripPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/ws/plan"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back to Trip Types
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">
                Solo Travel
              </span>
            </div>

            <h1 className="font-serif text-4xl md:text-6xl text-foreground mb-6 text-balance">
              Your Perfect Solo Adventure Awaits
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              Travel on your own terms with AI-powered planning, safety
              features, and 24/7 support. Freedom to explore, with help whenever
              you need it.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8"
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
              Solo Travel, Elevated
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              All the independence you want, with support when you need it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit) => (
              <Card
                key={benefit.title}
                className="bg-card border border-border"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-primary-foreground" />
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

      {/* Experience Types */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-5">
                Curated Experiences for Solo Travelers
              </h2>

              <p className="text-muted-foreground mb-8 leading-relaxed">
                Our AI learns your preferences and curates unique experiences —
                from hidden cafes to photography spots to local events perfect
                for meeting fellow travelers.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {experiences.map((exp) => (
                  <div
                    key={exp.title}
                    className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg"
                  >
                    <exp.icon className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground text-sm">
                        {exp.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {exp.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Card className="bg-card border border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Today's Recommendations
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Based on your interests
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Morning: Tsukiji Outer Market
                      </span>
                      <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded">
                        Food
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Best sushi breakfast spots, opens 5am
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Afternoon: Yanaka District
                      </span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Hidden Gem
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Old Tokyo vibes, great for photography
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Evening: Shinjuku Golden Gai
                      </span>
                      <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-1 rounded">
                        Social
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Meet fellow travelers at tiny bars
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 mb-5">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">
                Solo Safety
              </span>
            </div>

            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-5">
              Travel Confidently, Even Alone
            </h2>

            <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
              Share your real-time location and itinerary with trusted contacts,
              access 24/7 support in any timezone, and get instant help in local
              languages.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-card rounded-xl border border-border">
                <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-4" />
                <h4 className="font-semibold text-foreground mb-2">
                  Share Itinerary
                </h4>
                <p className="text-sm text-muted-foreground">
                  Keep loved ones updated on your plans automatically
                </p>
              </div>

              <div className="p-6 bg-card rounded-xl border border-border">
                <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-4" />
                <h4 className="font-semibold text-foreground mb-2">
                  24/7 Support
                </h4>
                <p className="text-sm text-muted-foreground">
                  Human help available any time, in your language
                </p>
              </div>

              <div className="p-6 bg-card rounded-xl border border-border">
                <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-4" />
                <h4 className="font-semibold text-foreground mb-2">
                  Local Assistance
                </h4>
                <p className="text-sm text-muted-foreground">
                  AI translates and contacts local services for you
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-primary-foreground mb-4">
            Ready for Your Solo Adventure?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Start planning your perfect trip today. It's free to begin.
          </p>
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 text-lg px-8"
          >
            Plan My Solo Trip
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
