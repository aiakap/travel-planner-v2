import { auth } from "@/auth";

import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { PageHeader } from "@/app/ws/components/page-header-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import {
  DollarSign,
  Globe,
  Users,
  Calendar,
  TrendingUp,
  Shield,
  Bot,
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  MapPin,
} from "lucide-react";
import Link from "next/link";

const benefits = [
  {
    icon: DollarSign,
    title: "Earn on Your Terms",
    description:
      "Set your own prices, choose your dates, and keep the majority of your earnings. Transparent payouts with no hidden fees.",
    color: "bg-emerald-500",
  },
  {
    icon: Globe,
    title: "Custom Trip Website",
    description:
      "Every trip you create gets a beautiful, shareable website. Perfect for marketing and building your brand.",
    color: "bg-teal-500",
  },
  {
    icon: Bot,
    title: "AI Planning Assistant",
    description:
      "Let our AI help you build itineraries, estimate costs, and handle logistics. Focus on the experience, not the paperwork.",
    color: "bg-amber-500",
  },
  {
    icon: Shield,
    title: "Verified Community",
    description:
      "Background checks for peace of mind. See who's joining your trip and build trust with your travelers.",
    color: "bg-rose-400",
  },
];

const guideTypes = [
  {
    title: "Local Experts",
    description:
      "Share your hometown with travelers from around the world. Lead day trips, food tours, or multi-day explorations of your region.",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80",
    earnings: "$500 - $2,000",
    commitment: "Flexible hours",
  },
  {
    title: "Adventure Guides",
    description:
      "Lead hiking, diving, climbing, or other adventure trips. Certification and experience required for specialized activities.",
    image:
      "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=600&q=80",
    earnings: "$2,000 - $5,000",
    commitment: "Per expedition",
  },
  {
    title: "Cultural Ambassadors",
    description:
      "Create immersive cultural experiences. Art, history, cuisine, music—share your passion and expertise.",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80",
    earnings: "$1,000 - $3,000",
    commitment: "Per trip",
  },
];

const stats = [
  { value: "10,000+", label: "Active Guides" },
  { value: "$2.5M+", label: "Paid to Guides" },
  { value: "4.9", label: "Avg Guide Rating" },
  { value: "120+", label: "Countries" },
];

const steps = [
  {
    number: "1",
    title: "Apply to Lead",
    description:
      "Tell us about yourself, your experience, and what kind of trips you want to lead.",
  },
  {
    number: "2",
    title: "Get Verified",
    description:
      "Complete your background check and profile verification to build trust.",
  },
  {
    number: "3",
    title: "Create Your Trip",
    description:
      "Use our AI tools to build your itinerary and set your pricing.",
  },
  {
    number: "4",
    title: "Start Earning",
    description:
      "Publish your trip, attract travelers, and get paid after each adventure.",
  },
];

export default async function CreatorsPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 mb-5">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">
                  For Creators
                </span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 text-balance">
                Turn Your Passion Into Paid Adventures
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Lead trips, build community, and earn income doing what you
                love. Whether you're a local expert, adventure guide, or content
                creator, Ntourage gives you the tools to succeed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
                  asChild
                >
                  <Link href="/creators/apply">Apply to Lead Trips</Link>
                </Button>
                <Button variant="outline" className="px-8 bg-transparent" asChild>
                  <Link href="/creators/earnings">See Earning Potential</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800&q=80"
                  alt="Guide leading a group"
                  className="w-full h-full object-cover"
                />
              </div>
              <Card className="absolute -bottom-6 -left-6 bg-card border border-border shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-emerald-500/10">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-foreground">
                        $4,200
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Avg. monthly earnings
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-serif text-foreground mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Why Lead with Ntourage?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We handle the technology and support so you can focus on creating
              unforgettable experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <Card
                key={benefit.title}
                className="bg-card border border-border hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-xl ${benefit.color} flex items-center justify-center mb-4`}
                  >
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

      {/* Guide Types */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Find Your Path
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Different ways to share your expertise and earn income
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {guideTypes.map((type) => (
              <Card
                key={type.title}
                className="bg-card border border-border overflow-hidden group"
              >
                <div className="aspect-[3/2] overflow-hidden">
                  <img
                    src={type.image || "/placeholder.svg"}
                    alt={type.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-serif text-xl text-foreground mb-2">
                    {type.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {type.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {type.earnings}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {type.commitment}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How to Start */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              How to Get Started
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From application to your first trip in just a few steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-border -translate-x-4" />
                )}
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-serif mb-4">
                  {step.number}
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
              asChild
            >
              <Link href="/creators/apply">Start Your Application</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-24 px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <blockquote className="font-serif text-2xl md:text-3xl mb-8 text-balance">
            "Ntourage transformed my side passion into a real business. The
            tools make planning effortless, and the support team is incredible."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
              alt="Marco Silva"
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="text-left">
              <p className="font-semibold">Marco Silva</p>
              <p className="text-primary-foreground/70 text-sm">
                Adventure Guide, Patagonia
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            Ready to Lead?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of guides creating unforgettable experiences and
            building sustainable income.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
              asChild
            >
              <Link href="/creators/apply">Apply Now</Link>
            </Button>
            <Button variant="outline" className="px-8 bg-transparent" asChild>
              <Link href="/creators/influencers">For Influencers</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
