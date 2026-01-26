import { auth } from "@/auth";

import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { PageHeader } from "@/app/ws/components/page-header-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import { Badge } from "@/app/ws/ui/badge";
import {
  UserCheck,
  Shield,
  Star,
  MapPin,
  Languages,
  Clock,
  CheckCircle,
  Car,
  Camera,
  Utensils,
  Calendar,
} from "lucide-react";
import Link from "next/link";

const concierges = [
  {
    name: "Yuki Sato",
    location: "Tokyo, Japan",
    languages: ["Japanese", "English"],
    rating: 4.9,
    reviews: 127,
    price: "$45/hour",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
    specialties: ["Cultural tours", "Food experiences", "Translation"],
    verified: true,
  },
  {
    name: "Isabella Romano",
    location: "Florence, Italy",
    languages: ["Italian", "English", "French"],
    rating: 5.0,
    reviews: 89,
    price: "$50/hour",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80",
    specialties: ["Art & museums", "Wine tours", "Shopping"],
    verified: true,
  },
  {
    name: "Carlos Mendez",
    location: "Mexico City, Mexico",
    languages: ["Spanish", "English"],
    rating: 4.8,
    reviews: 156,
    price: "$35/hour",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80",
    specialties: ["Street food", "Local neighborhoods", "History"],
    verified: true,
  },
  {
    name: "Fatima Al-Hassan",
    location: "Marrakech, Morocco",
    languages: ["Arabic", "French", "English"],
    rating: 4.9,
    reviews: 94,
    price: "$40/hour",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80",
    specialties: ["Medina navigation", "Bargaining", "Hidden gems"],
    verified: true,
  },
];

const services = [
  {
    icon: Languages,
    title: "Translation & Communication",
    description:
      "Real-time translation, phone calls to local services, and helping you communicate with locals.",
  },
  {
    icon: MapPin,
    title: "Navigation & Logistics",
    description:
      "Getting around, finding addresses, arranging transportation, and avoiding tourist traps.",
  },
  {
    icon: Utensils,
    title: "Dining & Reservations",
    description:
      "Restaurant recommendations, making reservations, ordering in local language, dietary accommodations.",
  },
  {
    icon: Camera,
    title: "Local Experiences",
    description:
      "Access to hidden gems, local markets, cultural sites, and experiences off the beaten path.",
  },
  {
    icon: Car,
    title: "Transportation",
    description:
      "Airport pickups, arranging drivers, navigating public transit, and rental car assistance.",
  },
  {
    icon: Calendar,
    title: "Activity Booking",
    description:
      "Tickets, tours, classes, and experiences booked by someone who knows the local options.",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Browse Concierges",
    description:
      "Filter by location, language, specialty, and availability. Read reviews from other travelers.",
  },
  {
    step: "2",
    title: "Book Your Time",
    description:
      "Reserve by the hour or by the day. Message your concierge before arrival to share your needs.",
  },
  {
    step: "3",
    title: "Meet & Explore",
    description:
      "Your concierge meets you at your location. They handle everything while you enjoy the experience.",
  },
];

export default async function ConciergesPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            badge="Local Concierges"
            title="Your Person on the Ground"
            description="Hire verified local experts to join you during your trip. They handle logistics, translations, and recommendations while you focus on the experience."
          />
        </div>
      </section>

      {/* Featured Concierges */}
      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif text-2xl text-foreground mb-8">
            Featured Concierges
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {concierges.map((concierge) => (
              <Card
                key={concierge.name}
                className="bg-card border border-border overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={concierge.image || "/placeholder.svg"}
                    alt={concierge.name}
                    className="w-full h-full object-cover"
                  />
                  {concierge.verified && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-primary text-primary-foreground gap-1">
                        <Shield className="h-3 w-3" />
                        Verified
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {concierge.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {concierge.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-foreground">
                          {concierge.rating}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({concierge.reviews})
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {concierge.languages.map((lang) => (
                      <span
                        key={lang}
                        className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {concierge.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="text-xs px-2 py-0.5 bg-primary/10 rounded text-primary"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="font-semibold text-foreground">
                      {concierge.price}
                    </span>
                    <Button size="sm" variant="outline">
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline">Browse All Concierges</Button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              What Concierges Help With
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From simple translations to complex logistics, your concierge
              handles it all
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card
                key={service.title}
                className="bg-card border border-border"
              >
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-serif mx-auto mb-4">
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
      </section>

      {/* Trust & Safety */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 mb-5">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">
                  Trust & Safety
                </span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
                Verified & Background Checked
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Every concierge on our platform undergoes thorough vetting. We
                verify identity, check references, and conduct background
                checks—so you can feel confident.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <span className="text-foreground">
                    Identity verification required
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <span className="text-foreground">
                    Background check completed
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <span className="text-foreground">
                    Reviews from verified travelers
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <span className="text-foreground">
                    Secure payments—pay after service
                  </span>
                </li>
              </ul>
            </div>
            <div className="aspect-square bg-card border border-border rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
                <p className="font-serif text-2xl text-foreground">100%</p>
                <p className="text-muted-foreground">Verified Concierges</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            Ready to Explore with a Local?
          </h2>
          <p className="text-muted-foreground mb-8">
            Add a concierge to your trip and experience destinations like an
            insider.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
              Find a Concierge
            </Button>
            <Button variant="outline" className="px-8 bg-transparent" asChild>
              <Link href="/ws/creators">Become a Concierge</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
