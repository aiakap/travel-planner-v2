import { auth } from "@/auth";

import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { PageHeader } from "@/app/ws/components/page-header-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import {
  Bot,
  Headphones,
  UserCheck,
  Globe,
  ArrowRight,
  Clock,
  Languages,
  Shield,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";

const supportOptions = [
  {
    icon: Bot,
    title: "AI Trip Support",
    description:
      "Your free AI travel companion that knows your itinerary and can help 24/7 in any language.",
    href: "/support/ai",
    color: "bg-teal-500",
    features: [
      "Knows your full itinerary",
      "Drafts messages in local languages",
      "Instant answers anytime",
    ],
  },
  {
    icon: Headphones,
    title: "24/7 Human Team",
    description:
      "Real people available around the clock to help with complex issues, emergencies, or anything you need.",
    href: "/support/team",
    color: "bg-emerald-500",
    features: [
      "Multilingual support",
      "Phone, chat, or email",
      "Emergency assistance",
    ],
  },
  {
    icon: UserCheck,
    title: "Local Concierges",
    description:
      "Hire a local expert to join you on the ground for translations, recommendations, and logistics.",
    href: "/support/concierges",
    color: "bg-amber-500",
    features: [
      "Verified locals",
      "Background checked",
      "Book by the hour or day",
    ],
  },
  {
    icon: Globe,
    title: "Help Center",
    description:
      "Self-service resources, FAQs, guides, and documentation to answer common questions.",
    href: "/support/help",
    color: "bg-rose-400",
    features: [
      "Searchable knowledge base",
      "Video tutorials",
      "Community forums",
    ],
  },
];

const stats = [
  { value: "24/7", label: "Support Available" },
  { value: "< 2 min", label: "Avg Response Time" },
  { value: "40+", label: "Languages" },
  { value: "98%", label: "Satisfaction Rate" },
];

export default async function SupportPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            badge="Support"
            title="Help When You Need It"
            description="From AI assistance to human experts to local guides on the ground—we've built multiple layers of support so you can travel with confidence."
          />
        </div>
      </section>

      {/* Stats */}
      <section className="pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-serif text-primary mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {supportOptions.map((option) => (
              <Link key={option.title} href={option.href}>
                <Card className="bg-card border border-border h-full hover:shadow-lg transition-shadow group">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div
                        className={`w-14 h-14 rounded-xl ${option.color} flex items-center justify-center`}
                      >
                        <option.icon className="h-7 w-7 text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>

                    <h3 className="font-serif text-2xl text-foreground mb-3">
                      {option.title}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {option.description}
                    </p>

                    <ul className="space-y-2">
                      {option.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-sm text-foreground"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Together */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Support That Works Together
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our support layers are designed to escalate seamlessly, so you
              always get the right help at the right time.
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-border -translate-y-1/2" />
            <div className="grid md:grid-cols-4 gap-8 relative">
              {[
                {
                  step: "1",
                  title: "Ask AI",
                  description:
                    "Start with instant AI help for quick questions and translations",
                },
                {
                  step: "2",
                  title: "Chat with Team",
                  description:
                    "Escalate to our human team for complex issues or emergencies",
                },
                {
                  step: "3",
                  title: "Call Support",
                  description:
                    "Phone support available 24/7 for urgent situations",
                },
                {
                  step: "4",
                  title: "Local Help",
                  description:
                    "Connect with on-ground concierges when you need in-person assistance",
                },
              ].map((item) => (
                <div key={item.step} className="text-center relative">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold mx-auto mb-4 relative z-10">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            Questions Before You Travel?
          </h2>
          <p className="text-muted-foreground mb-8">
            Our team is here to help you plan the perfect trip.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat with Us
            </Button>
            <Button variant="outline" className="px-8 bg-transparent" asChild>
              <Link href="/support/help">Browse Help Center</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
