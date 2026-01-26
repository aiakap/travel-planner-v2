import { auth } from "@/auth";


import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { PageHeader } from "@/app/ws/components/page-header-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import {
  Globe,
  Heart,
  Users,
  Sparkles,
  MapPin,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const values = [
  {
    icon: Globe,
    title: "Travel Should Be Accessible",
    description:
      "We believe everyone deserves to explore the world, regardless of experience level or travel anxiety.",
    color: "bg-primary",
  },
  {
    icon: Users,
    title: "Community Over Isolation",
    description:
      "The best travel memories come from shared experiences. We connect like-minded travelers together.",
    color: "bg-emerald-500",
  },
  {
    icon: Heart,
    title: "Trust Is Everything",
    description:
      "Background checks, verified profiles, and transparent ratings ensure you always know who you're traveling with.",
    color: "bg-rose-400",
  },
  {
    icon: Sparkles,
    title: "Technology Enhances, Never Replaces",
    description:
      "Our AI and tools handle the logistics so you can focus on what matters: the experience itself.",
    color: "bg-amber-500",
  },
];

const milestones = [
  {
    year: "2022",
    title: "The Idea",
    description:
      "Founded by travelers frustrated with the complexity of planning group trips and the lack of trust in travel companions.",
  },
  {
    year: "2023",
    title: "First Trips",
    description:
      "Launched beta with 50 creators leading trips across 12 countries. Learned what travelers actually need.",
  },
  {
    year: "2024",
    title: "AI Companion",
    description:
      "Introduced the AI Trip Companion, revolutionizing how travelers get support during their journeys.",
  },
  {
    year: "2025",
    title: "Global Scale",
    description:
      "Now supporting 50,000+ trips across 120+ countries with 24/7 human support in 40+ languages.",
  },
];

const team = [
  {
    name: "Sarah Chen",
    role: "CEO & Co-founder",
    bio: "Former Airbnb product lead. Has visited 65 countries.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop",
  },
  {
    name: "Marcus Thompson",
    role: "CTO & Co-founder",
    bio: "Built travel tech at Google. Passionate about accessible tourism.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  },
  {
    name: "Yuki Tanaka",
    role: "Head of Creator Success",
    bio: "Former travel influencer with 2M followers. Led 100+ group trips.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
  },
  {
    name: "David Okonkwo",
    role: "Head of Trust & Safety",
    bio: "Previously led safety at Uber. Expert in building trusted marketplaces.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
  },
];

export default async function AboutPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      <PageHeader
        badge="Our Story"
        title="Making Travel Social Again"
        description="We're building the future of group travel—where planning is effortless, trust is built-in, and every trip creates lasting connections."
      />

      {/* Mission Section */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
            Our Mission
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            To empower anyone to lead, join, or plan extraordinary travel
            experiences with the confidence that comes from verified companions,
            AI-powered support, and a global community of fellow adventurers.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              What We Believe
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our values guide every feature we build and every decision we make
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="bg-card border border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${value.color}`}>
                      <value.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {value.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Our Journey
            </h2>
            <p className="text-muted-foreground">
              From idea to global platform in just a few years
            </p>
          </div>

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={milestone.year} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {milestone.year}
                  </div>
                  {index < milestones.length - 1 && (
                    <div className="w-px h-full bg-border mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="font-semibold text-foreground mb-1">
                    {milestone.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {milestone.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Leadership Team
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Travelers building for travelers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <Card key={member.name} className="bg-card border border-border">
                <CardContent className="p-6 text-center">
                  <img
                    src={member.image || "/placeholder.svg"}
                    alt={member.name}
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="font-semibold text-foreground">
                    {member.name}
                  </h3>
                  <p className="text-sm text-primary mb-2">{member.role}</p>
                  <p className="text-xs text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <div className="text-primary-foreground/80">Trips Planned</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">120+</div>
              <div className="text-primary-foreground/80">Countries</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5,000+</div>
              <div className="text-primary-foreground/80">Active Creators</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.9</div>
              <div className="text-primary-foreground/80">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            Join Our Journey
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you want to explore the world or help others do the same,
            there's a place for you at Ntourage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              asChild
            >
              <Link href="/ws/discover">
                Start Exploring
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/about/careers">View Open Roles</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
