import { auth } from "@/auth";

import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { PageHeader } from "@/app/ws/components/page-header-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import {
  Search,
  CalendarCheck,
  Users,
  Bot,
  Headphones,
  Globe,
  Shield,
  Sparkles,
  MessageCircle,
  MapPin,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Find Your Trip",
    description:
      "Browse our curated collection of trips or use AI to plan something custom. Filter by destination, dates, group size, or travel style.",
    icon: Search,
    color: "bg-teal-500",
  },
  {
    number: "02",
    title: "Book with Confidence",
    description:
      "Review your guide's profile, ratings, and background check. Secure your spot with transparent pricing and flexible payment options.",
    icon: CalendarCheck,
    color: "bg-emerald-500",
  },
  {
    number: "03",
    title: "Meet Your Group",
    description:
      "Connect with fellow travelers before the trip. See verified profiles, share expectations, and start building friendships.",
    icon: Users,
    color: "bg-amber-500",
  },
  {
    number: "04",
    title: "Travel with Support",
    description:
      "Enjoy your adventure with AI assistance, 24/7 human support, and optional local concierges. We've got your back every step.",
    icon: Sparkles,
    color: "bg-rose-400",
  },
];

const features = [
  {
    icon: Globe,
    title: "Custom Trip Websites",
    description:
      "Every trip gets its own beautiful website to share with friends, family, or your audience.",
  },
  {
    icon: Bot,
    title: "Free AI Companion",
    description:
      "Your personal travel assistant knows your itinerary and can communicate with locals in any language.",
  },
  {
    icon: Headphones,
    title: "24/7 Human Support",
    description:
      "Multilingual team available around the clock for anything you need during your trip.",
  },
  {
    icon: Shield,
    title: "Verified Everyone",
    description:
      "Background checks available for guides, concierges, and even fellow travelers.",
  },
  {
    icon: MessageCircle,
    title: "Shareable Itineraries",
    description:
      "Detailed day-by-day plans you can share with anyone, complete with maps and booking details.",
  },
  {
    icon: MapPin,
    title: "Local Concierges",
    description:
      "Add a local expert to join you on the ground for translations, recommendations, and logistics.",
  },
];

const faqs = [
  {
    question: "How is Ntourage different from other travel platforms?",
    answer:
      "We combine AI-powered planning with human support. Every trip includes a free AI companion, optional 24/7 human assistance, and the ability to add local concierges. Plus, you can see verified profiles and background checks for everyone involved.",
  },
  {
    question: "What's included in the trip price?",
    answer:
      "Prices vary by trip, but typically include accommodations, guided experiences, some meals, and local transportation. The AI companion is always free. Human support and concierge services are optional add-ons.",
  },
  {
    question: "Can I plan a custom trip?",
    answer:
      "Absolutely! Use our AI trip planner to create a completely custom itinerary. You can then choose to travel solo, invite friends, or open it up to other travelers.",
  },
  {
    question: "How do background checks work?",
    answer:
      "All guides undergo mandatory background checks. Travelers can opt into background checks to build trust with their group. You'll see verification badges on profiles throughout the platform.",
  },
  {
    question: "What if I need to cancel?",
    answer:
      "Each trip has its own cancellation policy, clearly displayed before booking. Many trips offer flexible cancellation up to 30 days before departure.",
  },
];

export default async function HowItWorksPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            badge="How It Works"
            title="Travel Made Simple"
            description="From discovery to departure, we've designed every step to be seamless, safe, and supported."
          />
        </div>
      </section>

      {/* Steps */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-12">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`flex flex-col md:flex-row gap-8 items-center ${index % 2 === 1 ? "md:flex-row-reverse" : ""}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center`}
                    >
                      <step.icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-5xl font-serif text-muted-foreground/30">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="aspect-video bg-muted rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tools and support designed for the modern traveler
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-card border border-border">
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

      {/* FAQs */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.question} className="border-b border-border pb-6">
                <h3 className="font-semibold text-foreground mb-2">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Browse trips or create your own custom adventure with AI assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90"
              asChild
            >
              <Link href="/ws/discover">Browse Trips</Link>
            </Button>
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 bg-transparent"
              asChild
            >
              <Link href="/ws/plan">Plan Custom Trip</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
