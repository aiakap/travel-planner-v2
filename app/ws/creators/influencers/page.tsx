import { auth } from "@/auth";

import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import {
  Sparkles,
  Camera,
  Users,
  Globe,
  DollarSign,
  TrendingUp,
  Heart,
  MessageCircle,
  Calendar,
  CheckCircle,
  Star,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Globe,
    title: "Custom Trip Website",
    description:
      "A beautiful, branded landing page for your trip that you can share with your audience.",
  },
  {
    icon: Users,
    title: "Manage Applications",
    description:
      "Review applicants, set criteria, and handpick who joins your adventure.",
  },
  {
    icon: DollarSign,
    title: "Flexible Pricing",
    description:
      "Set your price, offer early-bird rates, and create exclusive tiers.",
  },
  {
    icon: Camera,
    title: "Content Support",
    description:
      "Coordinate with local photographers and videographers for amazing content.",
  },
  {
    icon: Calendar,
    title: "AI Trip Planning",
    description:
      "Build detailed itineraries with our AI assistant. We handle the logistics.",
  },
  {
    icon: Heart,
    title: "Community Building",
    description:
      "Connect with your travelers before, during, and after the trip.",
  },
];

const creators = [
  {
    name: "Alexandra Rivera",
    handle: "@alexplores",
    followers: "850K",
    platform: "Instagram",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80",
    trips: 12,
    quote: "My community trips have become the highlight of my year.",
  },
  {
    name: "Jordan Park",
    handle: "@jordanwanders",
    followers: "1.2M",
    platform: "YouTube",
    image:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&q=80",
    trips: 8,
    quote: "Finally, a platform that handles everything so I can focus on content.",
  },
  {
    name: "Priya Sharma",
    handle: "@priyatravels",
    followers: "620K",
    platform: "TikTok",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80",
    trips: 15,
    quote: "The AI planning tools saved me dozens of hours per trip.",
  },
];

const steps = [
  {
    number: "01",
    title: "Plan Your Dream Trip",
    description:
      "Use our AI to build the perfect itinerary. Pick destinations, activities, accommodations, and set your group size.",
  },
  {
    number: "02",
    title: "Customize Your Page",
    description:
      "Create a beautiful trip landing page with your branding. Add photos, write compelling descriptions, set your pricing.",
  },
  {
    number: "03",
    title: "Share with Your Audience",
    description:
      "Announce your trip across your platforms. We provide assets and copy to help you promote.",
  },
  {
    number: "04",
    title: "Travel Together",
    description:
      "Lead your community on an unforgettable adventure. We handle logistics, you create memories.",
  },
];

export default async function InfluencersPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gradient-to-r from-rose-500/10 to-amber-500/10 mb-5">
                <Sparkles className="h-4 w-4 text-rose-500" />
                <span className="text-sm text-rose-500 font-medium">
                  For Influencers & Creators
                </span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 text-balance">
                Take Your Audience on an Adventure
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Create custom group trips for your community. We handle the
                planning, logistics, and support—you bring the magic.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                  Create Your Trip
                </Button>
                <Button variant="outline" className="px-8 bg-transparent">
                  See How It Works
                </Button>
              </div>

              <div className="mt-8 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {creators.map((creator) => (
                    <img
                      key={creator.handle}
                      src={creator.image || "/placeholder.svg"}
                      alt={creator.name}
                      className="w-10 h-10 rounded-full border-2 border-background object-cover"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Join <span className="font-semibold text-foreground">500+</span>{" "}
                  creators leading trips
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=800&q=80"
                  alt="Creator leading a group trip"
                  className="w-full h-full object-cover"
                />
              </div>
              <Card className="absolute -bottom-6 -right-6 bg-card border border-border shadow-lg max-w-xs">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80"
                      alt="Creator"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        Bali Creator Retreat
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by @alexplores
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">24/30 spots filled</span>
                    <span className="font-semibold text-emerald-500">$72,000</span>
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-emerald-500 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              From Idea to Adventure
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Create unforgettable experiences for your community in four simple
              steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.number}>
                <span className="text-5xl font-serif text-primary/20">
                  {step.number}
                </span>
                <h3 className="font-semibold text-foreground mt-2 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tools designed specifically for content creators and influencers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="bg-card border border-border hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Creator Testimonials */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Trusted by Top Creators
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {creators.map((creator) => (
              <Card
                key={creator.handle}
                className="bg-card border border-border"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={creator.image || "/placeholder.svg"}
                      alt={creator.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-foreground">
                        {creator.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {creator.handle}
                      </p>
                    </div>
                  </div>
                  <p className="text-foreground mb-4">"{creator.quote}"</p>
                  <div className="flex items-center justify-between pt-4 border-t border-border text-sm">
                    <span className="text-muted-foreground">
                      {creator.followers} followers
                    </span>
                    <span className="text-muted-foreground">
                      {creator.trips} trips led
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Potential */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
                Real Earning Potential
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Creators on Ntourage earn significant income from their trips.
                With transparent pricing and low platform fees, you keep more of
                what you earn.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <span className="text-foreground">
                    Keep 85% of trip revenue (after costs)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <span className="text-foreground">
                    Set your own prices and group sizes
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <span className="text-foreground">
                    Fast payouts within 7 days of trip completion
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <span className="text-foreground">
                    No upfront costs or subscription fees
                  </span>
                </li>
              </ul>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                asChild
              >
                <Link href="/creators/earnings">See Earnings Calculator</Link>
              </Button>
            </div>
            <div>
              <Card className="bg-card border border-border">
                <CardContent className="p-8">
                  <h3 className="text-lg font-semibold text-foreground mb-6">
                    Example Trip Earnings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trip Price</span>
                      <span className="font-medium text-foreground">
                        $3,000 x 20 travelers
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross Revenue</span>
                      <span className="font-medium text-foreground">$60,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Trip Costs (hotels, transport, etc.)
                      </span>
                      <span className="font-medium text-foreground">
                        -$35,000
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Platform Fee (15%)
                      </span>
                      <span className="font-medium text-foreground">-$3,750</span>
                    </div>
                    <div className="border-t border-border pt-4 flex justify-between">
                      <span className="font-semibold text-foreground">
                        Your Earnings
                      </span>
                      <span className="text-2xl font-bold text-emerald-500">
                        $21,250
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl mb-4">
            Ready to Lead Your First Trip?
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Create a custom adventure for your community. We'll help you every
            step of the way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90 px-8"
            >
              Start Planning
            </Button>
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 bg-transparent px-8"
            >
              Talk to Our Team
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
