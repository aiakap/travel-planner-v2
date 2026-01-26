import { auth } from "@/auth";

import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { PageHeader } from "@/app/ws/components/page-header-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import { Input } from "@/app/ws/ui/input";
import {
  Search,
  BookOpen,
  CreditCard,
  Calendar,
  Users,
  Shield,
  Bot,
  MessageCircle,
  ChevronRight,
  FileText,
  Video,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading";

const categories = [
  {
    icon: BookOpen,
    title: "Getting Started",
    description: "New to Ntourage? Start here",
    articles: 12,
    href: "#",
  },
  {
    icon: Calendar,
    title: "Booking & Reservations",
    description: "Payment, cancellations, and changes",
    articles: 18,
    href: "#",
  },
  {
    icon: Users,
    title: "Group Trips",
    description: "Joining, organizing, and managing groups",
    articles: 15,
    href: "#",
  },
  {
    icon: Shield,
    title: "Trust & Safety",
    description: "Background checks and verification",
    articles: 9,
    href: "#",
  },
  {
    icon: Bot,
    title: "AI & Technology",
    description: "Using your AI companion and tools",
    articles: 11,
    href: "#",
  },
  {
    icon: CreditCard,
    title: "Payments & Refunds",
    description: "Billing, refunds, and pricing",
    articles: 14,
    href: "#",
  },
];

const popularArticles = [
  {
    title: "How do I book a trip?",
    category: "Getting Started",
    views: "12.4K",
  },
  {
    title: "What's included in the trip price?",
    category: "Booking",
    views: "9.8K",
  },
  {
    title: "How do background checks work?",
    category: "Trust & Safety",
    views: "8.2K",
  },
  {
    title: "Can I cancel my booking?",
    category: "Cancellations",
    views: "7.5K",
  },
  {
    title: "How to use the AI trip companion",
    category: "AI & Technology",
    views: "6.9K",
  },
  {
    title: "Becoming a trip guide",
    category: "For Creators",
    views: "5.4K",
  },
];

const resources = [
  {
    icon: FileText,
    title: "Travel Guides",
    description: "Destination guides and travel tips",
    cta: "Browse Guides",
  },
  {
    icon: Video,
    title: "Video Tutorials",
    description: "Step-by-step walkthroughs",
    cta: "Watch Videos",
  },
  {
    icon: HelpCircle,
    title: "FAQs",
    description: "Quick answers to common questions",
    cta: "View FAQs",
  },
];

export default async function HelpCenterPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      {/* Hero with Search */}
      <section className="pt-32 pb-16 px-6 bg-muted">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
            How can we help?
          </h1>
          <p className="text-muted-foreground mb-8">
            Search our knowledge base or browse categories below
          </p>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for help articles..."
              className="pl-12 h-14 text-lg bg-background border-border"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif text-2xl text-foreground mb-8">
            Browse by Category
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link key={category.title} href={category.href}>
                <Card className="bg-card border border-border h-full hover:shadow-md transition-shadow group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-xl bg-primary/10 mb-4">
                        <category.icon className="h-6 w-6 text-primary" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {category.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {category.description}
                    </p>
                    <p className="text-xs text-primary">
                      {category.articles} articles
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl text-foreground mb-8">
            Popular Articles
          </h2>
          <Card className="bg-card border border-border">
            <CardContent className="p-0">
              {popularArticles.map((article, index) => (
                <Link
                  key={article.title}
                  href="#"
                  className={`flex items-center justify-between p-5 hover:bg-muted transition-colors ${
                    index !== popularArticles.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  <div>
                    <h3 className="font-medium text-foreground mb-1">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {article.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {article.views} views
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Resources */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl text-foreground mb-8">
            More Resources
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <Card
                key={resource.title}
                className="bg-card border border-border text-center"
              >
                <CardContent className="p-6">
                  <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                    <resource.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {resource.description}
                  </p>
                  <Button variant="outline" size="sm">
                    {resource.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl mb-4">
            {"Can't find what you're looking for?"}
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Our support team is available 24/7 to help with any questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Start a Chat
            </Button>
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 bg-transparent"
              asChild
            >
              <Link href="/support/team">Contact Support</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export function generateStaticParams() {
  return [{ search: "" }];
}
