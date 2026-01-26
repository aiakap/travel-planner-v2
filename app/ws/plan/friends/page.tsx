import { auth } from "@/auth";


import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import {
  Users,
  Vote,
  CreditCard,
  Calendar,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  DollarSign,
  UserPlus,
  ThumbsUp,
  Split,
} from "lucide-react";
import Link from "next/link";

const benefits = [
  {
    icon: Vote,
    title: "Group Voting",
    description:
      "Let everyone vote on activities, restaurants, and accommodations. Democracy made easy.",
  },
  {
    icon: Split,
    title: "Split Costs",
    description:
      "Track shared expenses, split bills fairly, and settle up with integrated payments.",
  },
  {
    icon: Calendar,
    title: "Find Dates That Work",
    description:
      "See everyone's availability at a glance and find the perfect window for your trip.",
  },
  {
    icon: MessageCircle,
    title: "Group Chat",
    description:
      "Discuss plans, share ideas, and coordinate without leaving the platform.",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Start your trip idea",
    description: "Pick a destination or theme and set a rough budget.",
  },
  {
    step: "2",
    title: "Invite your crew",
    description: "Friends join and add their availability and preferences.",
  },
  {
    step: "3",
    title: "Vote on options",
    description: "AI suggests activities, everyone votes on favorites.",
  },
  {
    step: "4",
    title: "Book together",
    description: "Lock in plans, split costs, and get your custom itineraries.",
  },
];

export default async function FriendsTripPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/ws/plan"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back to Trip Types
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 mb-6">
              <Users className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-500 font-medium">
                Friends Getaway
              </span>
            </div>

            <h1 className="font-serif text-4xl md:text-6xl text-foreground mb-6 text-balance">
              Plan Epic Trips with Your Crew
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              Coordinating group travel is chaos. We make it simple — vote on
              activities, split costs automatically, and give everyone their own
              personalized itinerary.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-amber-500 text-white hover:bg-amber-600 text-lg px-8"
              >
                Start a Group Trip
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

      {/* Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Group Travel, Finally Figured Out
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              No more endless group chats. No more spreadsheet chaos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit) => (
              <Card
                key={benefit.title}
                className="bg-card border border-border"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center mb-4">
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

      {/* Voting Feature */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500/10 mb-5">
                <ThumbsUp className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-500 font-medium">
                  Group Decisions
                </span>
              </div>

              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-5">
                Vote on Everything
              </h2>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                Skip the "I don't mind, whatever you want" loop. Post options
                for activities, restaurants, or accommodations and let everyone
                vote. The most popular choices win.
              </p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5" />
                  <span className="text-foreground">
                    Upvote/downvote on activities and venues
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5" />
                  <span className="text-foreground">
                    See who's in and who's out for each activity
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5" />
                  <span className="text-foreground">
                    AI suggests options based on group preferences
                  </span>
                </li>
              </ul>

              <Button className="bg-amber-500 text-white hover:bg-amber-600">
                Start Your Group Trip
              </Button>
            </div>

            <Card className="bg-card border border-border">
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4">
                  Vote: Saturday Night Dinner
                </h4>

                <div className="space-y-3">
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">
                        Nobu Downtown
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-amber-500 font-semibold">
                          5 votes
                        </span>
                        <ThumbsUp className="h-4 w-4 text-amber-500 fill-amber-500" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Upscale Japanese • $$$
                    </p>
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs border-2 border-card">
                        J
                      </div>
                      <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white text-xs border-2 border-card">
                        S
                      </div>
                      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs border-2 border-card">
                        M
                      </div>
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs border-2 border-card">
                        A
                      </div>
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs border-2 border-card">
                        +1
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">
                        Carbone
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground font-semibold">
                          3 votes
                        </span>
                        <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Italian-American • $$$
                    </p>
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs border-2 border-card">
                        J
                      </div>
                      <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white text-xs border-2 border-card">
                        S
                      </div>
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs border-2 border-card">
                        A
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">
                        Local Street Food Tour
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground font-semibold">
                          2 votes
                        </span>
                        <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Walking food tour • $$
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full mt-4 bg-amber-500 text-white hover:bg-amber-600"
                  size="sm"
                >
                  + Suggest Another Option
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Cost Splitting */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <Card className="bg-card border border-border order-2 lg:order-1">
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4">
                  Trip Expenses
                </h4>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        Airbnb Villa
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Split 6 ways
                      </p>
                    </div>
                    <span className="font-semibold text-foreground">
                      $2,400
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        Boat Day
                      </p>
                      <p className="text-xs text-muted-foreground">
                        5 people going
                      </p>
                    </div>
                    <span className="font-semibold text-foreground">$800</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        Group Dinner
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Split equally
                      </p>
                    </div>
                    <span className="font-semibold text-foreground">$450</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-muted-foreground">
                      Your share so far:
                    </span>
                    <span className="text-xl font-semibold text-foreground">
                      $608
                    </span>
                  </div>
                  <Button
                    className="w-full bg-amber-500 text-white hover:bg-amber-600"
                    size="sm"
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Settle Up
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500/10 mb-5">
                <CreditCard className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-500 font-medium">
                  Cost Splitting
                </span>
              </div>

              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-5">
                Split Costs Without the Drama
              </h2>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                Track every shared expense, see who owes what in real-time, and
                settle up with one click. No more Venmo chains or spreadsheet
                headaches.
              </p>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5" />
                  <span className="text-foreground">
                    Automatic per-person costs based on participation
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5" />
                  <span className="text-foreground">
                    Real-time balance tracking throughout the trip
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5" />
                  <span className="text-foreground">
                    Integrated payments — settle with one tap
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Flexible Invites */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500/10 mb-5">
              <UserPlus className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-500 font-medium">
                Flexible Invites
              </span>
            </div>

            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-5">
              Not Everyone Has to Do Everything
            </h2>

            <p className="text-muted-foreground max-w-2xl mx-auto">
              Some friends want the full week, others just the weekend. Someone
              can't make the hike but wants in on the beach day. Everyone joins
              what works for them.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white font-semibold mx-auto mb-4">
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

      {/* CTA */}
      <section className="py-20 bg-amber-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
            Ready to Rally the Squad?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Start planning your group adventure today. It's free to begin and
            invite friends.
          </p>
          <Button
            size="lg"
            className="bg-white text-amber-500 hover:bg-white/90 text-lg px-8"
          >
            Start a Group Trip
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
