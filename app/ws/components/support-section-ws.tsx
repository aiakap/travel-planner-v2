"use client";

import {
  Headphones,
  Globe,
  Phone,
  Clock,
  Languages,
  MapPin,
  Bot,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/app/ws/ui/card";
import { Button } from "@/app/ws/ui/button";

export function SupportSection() {
  return (
    <section className="py-20 bg-secondary/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-card border border-border col-span-2">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-amber-500">
                      <Headphones className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">
                        24/7 Remote Support Team
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Real humans ready to help anytime, anywhere
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border">
                <CardContent className="p-5">
                  <div className="p-3 rounded-lg bg-accent w-fit mb-3">
                    <Languages className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">
                    Multilingual
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Your language + the local language
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border">
                <CardContent className="p-5">
                  <div className="p-3 rounded-lg bg-emerald-500 w-fit mb-3">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">
                    Phone & Digital
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Calls, texts, emails handled
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border">
                <CardContent className="p-5">
                  <div className="p-3 rounded-lg bg-rose-400 w-fit mb-3">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">
                    Always Available
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    24/7, 365 days a year
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border">
                <CardContent className="p-5">
                  <div className="p-3 rounded-lg bg-amber-500 w-fit mb-3">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">
                    Global Coverage
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Support in 120+ countries
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500/10 mb-5">
              <Headphones className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-600 font-medium">
                Human Support
              </span>
            </div>

            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-5">
              A Real Team, Always There
            </h2>

            <p className="text-muted-foreground mb-6 leading-relaxed">
              Sometimes you need a real person. Our remote support team speaks
              your language and the local language, ready to make phone calls,
              send emails, or handle any electronic communication you need—24/7.
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <div className="w-1 h-1 rounded-full bg-amber-500 mt-2" />
                <span className="text-sm text-foreground">
                  Make reservations and bookings on your behalf
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1 h-1 rounded-full bg-amber-500 mt-2" />
                <span className="text-sm text-foreground">
                  Handle flight changes, cancellations, and rebookings
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1 h-1 rounded-full bg-amber-500 mt-2" />
                <span className="text-sm text-foreground">
                  Translate and communicate with local businesses
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1 h-1 rounded-full bg-amber-500 mt-2" />
                <span className="text-sm text-foreground">
                  Emergency assistance and problem resolution
                </span>
              </li>
            </ul>

            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Learn About Support Plans
            </Button>
          </div>
        </div>

        {/* AI Trip Support Section */}
        <div className="mt-20 pt-20 border-t border-border">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-card border border-border col-span-2">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary">
                        <Bot className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">
                          AI Trip Companion
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Your personal travel assistant that knows every detail
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardContent className="p-5">
                    <div className="p-3 rounded-lg bg-primary w-fit mb-3">
                      <MessageCircle className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">
                      Instant Answers
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Ask anything about your trip
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardContent className="p-5">
                    <div className="p-3 rounded-lg bg-emerald-500 w-fit mb-3">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">
                      Smart Suggestions
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Personalized recommendations
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardContent className="p-5">
                    <div className="p-3 rounded-lg bg-amber-500 w-fit mb-3">
                      <Languages className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">
                      Local Messaging
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Draft messages to providers
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardContent className="p-5">
                    <div className="p-3 rounded-lg bg-rose-400 w-fit mb-3">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">
                      Always Free
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Included with every trip
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 mb-5">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">
                  AI Trip Support
                </span>
              </div>

              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-5">
                Your AI Travel Companion
              </h2>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                Every trip comes with a free AI companion that knows your entire
                itinerary, preferences, and travel style. Ask questions, get
                recommendations, or have it draft messages to local restaurants
                and providers in any language.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-primary mt-2" />
                  <span className="text-sm text-foreground">
                    Knows your full itinerary, bookings, and preferences
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-primary mt-2" />
                  <span className="text-sm text-foreground">
                    Draft and send messages to local businesses in their language
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-primary mt-2" />
                  <span className="text-sm text-foreground">
                    Real-time suggestions based on your location and schedule
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-primary mt-2" />
                  <span className="text-sm text-foreground">
                    Available 24/7 on your phone, no app download required
                  </span>
                </li>
              </ul>

              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                See It In Action
              </Button>
            </div>
          </div>
        </div>

        {/* Local Concierge Section */}
        <div className="mt-20 pt-20 border-t border-border">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent/10 mb-5">
                <MapPin className="h-4 w-4 text-accent" />
                <span className="text-sm text-accent font-medium">
                  On-the-Ground Support
                </span>
              </div>

              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-5">
                Local Trip Concierges
              </h2>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                Travel with a local expert by your side. Our vetted concierges
                know the hidden gems, speak the language, and can navigate any
                situation—from finding the best street food to handling
                emergencies.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-accent mt-2" />
                  <span className="text-sm text-foreground">
                    Background-checked and verified local experts
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-accent mt-2" />
                  <span className="text-sm text-foreground">
                    Available for full days or specific activities
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-accent mt-2" />
                  <span className="text-sm text-foreground">
                    Insider knowledge and local recommendations
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-accent mt-2" />
                  <span className="text-sm text-foreground">
                    Ratings and reviews from previous travelers
                  </span>
                </li>
              </ul>

              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Browse Local Concierges
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  name: "Yuki T.",
                  location: "Tokyo, Japan",
                  rating: "4.9",
                  trips: "127",
                  specialty: "Food & Culture",
                },
                {
                  name: "Marco R.",
                  location: "Rome, Italy",
                  rating: "5.0",
                  trips: "89",
                  specialty: "History & Art",
                },
                {
                  name: "Priya S.",
                  location: "Mumbai, India",
                  rating: "4.8",
                  trips: "156",
                  specialty: "Local Markets",
                },
                {
                  name: "Carlos M.",
                  location: "Mexico City",
                  rating: "4.9",
                  trips: "203",
                  specialty: "Nightlife & Music",
                },
              ].map((concierge, index) => (
                <Card
                  key={index}
                  className="bg-card border border-border hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="w-10 h-10 rounded-full bg-secondary mb-3 flex items-center justify-center text-sm font-semibold text-foreground">
                      {concierge.name.charAt(0)}
                    </div>
                    <h4 className="font-semibold text-foreground text-sm">
                      {concierge.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {concierge.location}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-amber-500">★ {concierge.rating}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {concierge.trips} trips
                      </span>
                    </div>
                    <div className="mt-2 text-xs px-2 py-1 bg-secondary rounded-md inline-block text-muted-foreground">
                      {concierge.specialty}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
