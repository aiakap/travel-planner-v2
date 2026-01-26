import { auth } from "@/auth";

import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { PageHeader } from "@/app/ws/components/page-header-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import {
  Bot,
  MessageCircle,
  Languages,
  MapPin,
  Clock,
  Sparkles,
  Send,
  CheckCircle,
  Globe,
  Zap,
} from "lucide-react";
import Link from "next/link";

const capabilities = [
  {
    icon: MessageCircle,
    title: "Instant Answers",
    description:
      "Ask anything about your trip—what time is checkout, where's the best coffee nearby, what's on the itinerary tomorrow.",
  },
  {
    icon: Languages,
    title: "Local Language Help",
    description:
      "Draft messages to restaurants, hotels, and local providers in their language. Perfect for reservations and requests.",
  },
  {
    icon: MapPin,
    title: "Real-Time Suggestions",
    description:
      "Get personalized recommendations based on your location, schedule, and preferences.",
  },
  {
    icon: Clock,
    title: "Always Available",
    description:
      "24/7 access from your phone—no app download required. Works via web, SMS, or WhatsApp.",
  },
  {
    icon: Sparkles,
    title: "Knows Your Trip",
    description:
      "Your AI companion has full context of your itinerary, bookings, preferences, and group details.",
  },
  {
    icon: Zap,
    title: "Completely Free",
    description:
      "Included with every Ntourage trip at no extra cost. Unlimited questions, unlimited help.",
  },
];

const exampleConversations = [
  {
    user: "What's the dress code for tonight's restaurant?",
    ai: "For Ristorante Cibreo tonight at 8pm, the dress code is smart casual. I'd recommend avoiding shorts and open-toed shoes. The restaurant is about a 12-minute walk from your hotel.",
  },
  {
    user: "Can you help me ask the hotel for extra towels?",
    ai: "Here's a message in Italian for the front desk:\n\n\"Buongiorno, potrei avere degli asciugamani extra per la camera 204? Grazie mille.\"\n\nWould you like me to send this to the hotel's WhatsApp, or would you prefer to show them this message?",
  },
  {
    user: "I'm feeling adventurous—what's something not on the itinerary I should check out?",
    ai: "Based on your interest in art and your free time tomorrow afternoon, I'd suggest the Palazzo Strozzi—there's a contemporary art exhibition that's getting great reviews. It's a 10-minute walk from your lunch spot. Want me to check ticket availability?",
  },
];

export default async function AISupportPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            badge="AI Trip Support"
            title="Your Personal Travel Companion"
            description="Every trip includes a free AI assistant that knows your entire itinerary and can help you in any language, anytime."
          />
        </div>
      </section>

      {/* Demo Chat */}
      <section className="pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-card border border-border overflow-hidden">
            <div className="bg-primary px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Ntourage AI</p>
                <p className="text-sm text-white/70">Your trip to Florence</p>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {exampleConversations.map((convo, index) => (
                <div key={index} className="space-y-4">
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
                      <p className="text-sm">{convo.user}</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
                      <p className="text-sm text-foreground whitespace-pre-line">
                        {convo.ai}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <input
                  type="text"
                  placeholder="Ask anything about your trip..."
                  className="flex-1 bg-muted rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button size="icon" className="rounded-full">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              What Your AI Can Do
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Trained on travel expertise and personalized to your trip
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((capability) => (
              <Card
                key={capability.title}
                className="bg-card border border-border"
              >
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                    <capability.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {capability.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {capability.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Access Options */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
                Access Anywhere
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Your AI companion works however you prefer—no apps to download,
                no accounts to create. Just instant help when you need it.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Web Chat</p>
                    <p className="text-sm text-muted-foreground">
                      Access from any browser on your trip website
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">WhatsApp</p>
                    <p className="text-sm text-muted-foreground">
                      Message your AI companion like a friend
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">SMS</p>
                    <p className="text-sm text-muted-foreground">
                      Text-based support when data is limited
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-card border border-border">
                <CardContent className="p-6 text-center">
                  <Globe className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="font-semibold text-foreground">40+</p>
                  <p className="text-sm text-muted-foreground">
                    Languages supported
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border border-border">
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="font-semibold text-foreground">{"< 3s"}</p>
                  <p className="text-sm text-muted-foreground">
                    Average response time
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border border-border">
                <CardContent className="p-6 text-center">
                  <MessageCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="font-semibold text-foreground">Unlimited</p>
                  <p className="text-sm text-muted-foreground">
                    Questions per trip
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border border-border">
                <CardContent className="p-6 text-center">
                  <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="font-semibold text-foreground">Free</p>
                  <p className="text-sm text-muted-foreground">
                    Included with every trip
                  </p>
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
            Need More Than AI?
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Our AI is powerful, but sometimes you need a human. Escalate to our
            24/7 team anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90"
              asChild
            >
              <Link href="/support/team">Meet Our Human Team</Link>
            </Button>
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 bg-transparent"
              asChild
            >
              <Link href="/ws/discover">Browse Trips</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
