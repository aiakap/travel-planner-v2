import { auth } from "@/auth";

import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { PageHeader } from "@/app/ws/components/page-header-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import {
  Bot,
  Globe,
  Calendar,
  CreditCard,
  Users,
  MessageCircle,
  BarChart,
  Shield,
  Sparkles,
  FileText,
  Mail,
  Camera,
} from "lucide-react";
import Link from "next/link";

const tools = [
  {
    category: "Planning",
    items: [
      {
        icon: Bot,
        title: "AI Trip Builder",
        description:
          "Describe your vision and let AI create a detailed itinerary. Edit, refine, and perfect your trip with intelligent suggestions.",
        color: "bg-teal-500",
      },
      {
        icon: Calendar,
        title: "Itinerary Manager",
        description:
          "Organize daily activities, track reservations, and manage timing. Drag-and-drop interface makes changes easy.",
        color: "bg-emerald-500",
      },
      {
        icon: CreditCard,
        title: "Cost Calculator",
        description:
          "Estimate trip costs, set profitable pricing, and forecast your earnings. Real-time budget tracking.",
        color: "bg-amber-500",
      },
    ],
  },
  {
    category: "Marketing",
    items: [
      {
        icon: Globe,
        title: "Trip Landing Pages",
        description:
          "Beautiful, customizable pages for each trip. Add your branding, photos, and compelling copy.",
        color: "bg-rose-400",
      },
      {
        icon: Mail,
        title: "Email Campaigns",
        description:
          "Built-in email tools to promote trips and communicate with travelers. Templates included.",
        color: "bg-indigo-500",
      },
      {
        icon: Camera,
        title: "Asset Library",
        description:
          "Store and organize photos, videos, and promotional materials. Easy sharing across platforms.",
        color: "bg-purple-500",
      },
    ],
  },
  {
    category: "Management",
    items: [
      {
        icon: Users,
        title: "Traveler Applications",
        description:
          "Review applications, set acceptance criteria, and build your ideal group. Background check integration.",
        color: "bg-teal-500",
      },
      {
        icon: MessageCircle,
        title: "Group Chat",
        description:
          "Coordinate with your travelers before and during the trip. Share updates, answer questions, build excitement.",
        color: "bg-emerald-500",
      },
      {
        icon: FileText,
        title: "Document Sharing",
        description:
          "Share itineraries, waivers, packing lists, and more. Travelers can access everything in one place.",
        color: "bg-amber-500",
      },
    ],
  },
  {
    category: "Analytics",
    items: [
      {
        icon: BarChart,
        title: "Performance Dashboard",
        description:
          "Track page views, applications, conversions, and revenue. Understand what drives bookings.",
        color: "bg-rose-400",
      },
      {
        icon: Sparkles,
        title: "AI Insights",
        description:
          "Get personalized recommendations to improve your trips based on traveler feedback and booking patterns.",
        color: "bg-indigo-500",
      },
      {
        icon: Shield,
        title: "Review Management",
        description:
          "Collect and display reviews from travelers. Respond to feedback and build your reputation.",
        color: "bg-purple-500",
      },
    ],
  },
];

export default async function ToolsPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            badge="Creator Tools"
            title="Everything You Need to Succeed"
            description="Powerful tools designed to help you plan, market, manage, and grow your trip business. All included with your Ntourage account."
          />
        </div>
      </section>

      {/* Tools Grid */}
      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          {tools.map((category) => (
            <div key={category.category}>
              <h2 className="font-serif text-2xl text-foreground mb-8">
                {category.category}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {category.items.map((tool) => (
                  <Card
                    key={tool.title}
                    className="bg-card border border-border hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div
                        className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center mb-4`}
                      >
                        <tool.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {tool.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {tool.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
                See It In Action
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Watch how easy it is to plan, publish, and manage a trip using
                our creator tools. From AI-powered itinerary building to
                automated traveler communication.
              </p>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Watch Demo Video
              </Button>
            </div>
            <div className="aspect-video bg-card border border-border rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground">Demo Video</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            Ready to Start Creating?
          </h2>
          <p className="text-muted-foreground mb-8">
            All tools are included free when you become a Ntourage guide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
              asChild
            >
              <Link href="/creators/apply">Apply to Lead Trips</Link>
            </Button>
            <Button variant="outline" className="px-8 bg-transparent" asChild>
              <Link href="/ws/creators">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
