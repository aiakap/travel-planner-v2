"use client";

import { Bot, Send, Sparkles, Languages, Clock, Zap } from "lucide-react";
import { Card, CardContent } from "@/app/ws/ui/card";

const aiFeatures = [
  {
    icon: Sparkles,
    title: "Knows Your Trip Inside Out",
    description:
      "Every restaurant reservation, flight time, and activity is at your AI companion's fingertips.",
  },
  {
    icon: Languages,
    title: "Breaks Language Barriers",
    description:
      "Communicate with local businesses in any language—your AI handles translation seamlessly.",
  },
  {
    icon: Send,
    title: "Messages Providers for You",
    description:
      "Need to change a reservation? Your AI can email, text, or call local providers on your behalf.",
  },
  {
    icon: Clock,
    title: "Available 24/7",
    description:
      "Day or night, your AI companion is ready to help with anything trip-related.",
  },
];

export function AICompanionSection() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent/10 mb-5">
              <Bot className="h-4 w-4 text-accent" />
              <span className="text-sm text-accent font-medium">
                Free with Every Trip
              </span>
            </div>

            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-5">
              Your AI Trip Companion
            </h2>

            <p className="text-muted-foreground mb-8 leading-relaxed">
              Meet your personal travel assistant that knows every detail of
              your journey. Ask questions, get recommendations, and let it
              handle communications with local providers—all in your language.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {aiFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Icon className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <Card className="bg-card border border-border shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
                  <div className="p-2 rounded-full bg-accent/10">
                    <Bot className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm">
                      Social Experiences AI
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Your Tokyo Trip • Always Online
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <Zap className="h-3 w-3 text-accent" />
                    <span className="text-xs text-accent">Active</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs text-foreground shrink-0">
                      You
                    </div>
                    <div className="flex-1 p-3 rounded-lg bg-secondary text-foreground text-sm">
                      Can you message the sushi restaurant about my
                      reservation tomorrow? I'd like to add one more person.
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1 p-3 rounded-lg bg-accent/10 text-foreground text-sm">
                      <p className="mb-2">
                        Absolutely! I'll contact Sushi Dai in Japanese right
                        now. Your current reservation is for 2 people at 7:00
                        PM.
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Message sent • Waiting for confirmation
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1 p-3 rounded-lg bg-accent/10 text-foreground text-sm">
                      <p>
                        Great news! Sushi Dai confirmed your updated
                        reservation for 3 people at 7:00 PM tomorrow. They also
                        mentioned the omakase special is available!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 p-3 rounded-lg bg-secondary">
                  <input
                    type="text"
                    placeholder="Ask anything about your trip..."
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <button className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
