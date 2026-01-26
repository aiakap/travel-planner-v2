import { auth } from "@/auth";


import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import {
  User,
  Users,
  Heart,
  Calendar,
  MapPin,
  Share2,
  Sparkles,
  Globe,
  CheckCircle2,
  ArrowRight,
  Mail,
  UserPlus,
  Route,
  Layers,
} from "lucide-react";
import Link from "next/link";

const tripTypes = [
  {
    icon: User,
    title: "Solo Adventure",
    description:
      "Plan your perfect getaway with AI-powered recommendations tailored just for you.",
    href: "/plan/solo",
    color: "bg-primary",
  },
  {
    icon: Heart,
    title: "Family Trip",
    description:
      "Coordinate activities for all ages with flexible scheduling and shared itineraries.",
    href: "/plan/family",
    color: "bg-rose-500",
  },
  {
    icon: Users,
    title: "Friends Getaway",
    description:
      "Split costs, vote on activities, and create memories together with group planning tools.",
    href: "/plan/friends",
    color: "bg-amber-500",
  },
];

const features = [
  {
    icon: UserPlus,
    title: "Invite Anyone",
    description:
      "Send invites for all or part of your trip. Friends and family join when they can.",
  },
  {
    icon: Layers,
    title: "Combined Itineraries",
    description:
      "Everyone sees their own personalized schedule as trips merge and overlap.",
  },
  {
    icon: Route,
    title: "Flexible Planning",
    description:
      "Add segments, change dates, and adjust plans without disrupting others.",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    description:
      "Share your trip website with a link. No app downloads required for guests.",
  },
  {
    icon: Sparkles,
    title: "AI Assistance",
    description:
      "Get smart suggestions based on everyone's preferences and travel styles.",
  },
  {
    icon: Globe,
    title: "Custom Website",
    description:
      "Every trip gets a beautiful website with all details, maps, and schedules.",
  },
];

const steps = [
  {
    number: "01",
    title: "Tell us where you want to go",
    description:
      "Start with a destination or let our AI suggest perfect matches based on your interests, budget, and travel dates.",
  },
  {
    number: "02",
    title: "Build your itinerary",
    description:
      "Add activities, accommodations, and experiences. Our AI helps with recommendations and handles the logistics.",
  },
  {
    number: "03",
    title: "Invite your travel companions",
    description:
      "Share invites for the whole trip or specific segments. Everyone can join for the parts that work for them.",
  },
  {
    number: "04",
    title: "Watch it come together",
    description:
      "Each person gets their own custom view as itineraries combine. Real-time updates keep everyone in sync.",
  },
];

export default async function PlanTripPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">
                Start Planning Today
              </span>
            </div>

            <h1 className="font-serif text-4xl md:text-6xl text-foreground mb-6 text-balance">
              Plan Your Perfect Trip
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Whether you're traveling solo, with family, or gathering friends
              for an adventure — we make planning seamless and collaborative.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                See How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trip Type Selection */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              What kind of trip are you planning?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose your adventure style and we'll tailor the experience to
              your needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tripTypes.map((type) => (
              <Link key={type.title} href={type.href}>
                <Card className="bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all h-full group cursor-pointer">
                  <CardContent className="p-8">
                    <div
                      className={`${type.color} w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                    >
                      <type.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {type.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {type.description}
                    </p>
                    <span className="text-primary font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Get Started <ArrowRight className="h-4 w-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              How Trip Planning Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From first idea to final itinerary, we guide you every step of the
              way.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex gap-6 mb-12 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-px h-full bg-border mt-4" />
                  )}
                </div>
                <div className="pb-12">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Invite Feature Highlight */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 mb-5">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">
                  Collaborative Planning
                </span>
              </div>

              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-5">
                Invite Friends & Family for Any Part of Your Trip
              </h2>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                Planning a two-week trip but your friends can only join for a
                weekend? No problem. Send invites for specific dates or
                activities, and everyone's itinerary updates automatically.
              </p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span className="text-foreground">
                    Invite people for the full trip or just specific segments
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span className="text-foreground">
                    Each person sees their own personalized itinerary
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span className="text-foreground">
                    Real-time updates when plans change
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span className="text-foreground">
                    No app downloads required — share via link
                  </span>
                </li>
              </ul>

              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Start Your Trip
              </Button>
            </div>

            <div className="relative">
              <Card className="bg-card border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-foreground">
                      Trip Participants
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border bg-transparent"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Invite
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                          Y
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            You
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Full trip: Jun 1-14
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Organizer
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white font-medium">
                          S
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            Sarah
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joining: Jun 5-10
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded">
                        Confirmed
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-medium">
                          M
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            Mike
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joining: Jun 8-14
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-1 rounded">
                        Pending
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-dashed border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground text-sm">
                            Invite someone
                          </p>
                          <p className="text-xs text-muted-foreground">
                            For any dates
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Everything You Need to Plan
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful tools that make trip planning effortless and enjoyable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="bg-card border border-border"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
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

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-primary-foreground mb-4">
            Ready to Plan Your Trip?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Start planning today and get your custom trip website, AI assistant,
            and all the tools you need — free.
          </p>
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 text-lg px-8"
          >
            Start Planning Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
