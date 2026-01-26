import { auth } from "@/auth";


import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { PageHeader } from "@/app/ws/components/page-header-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import { Badge } from "@/app/ws/ui/badge";
import {
  Download,
  Mail,
  ExternalLink,
  FileText,
  ImageIcon,
  Video,
  ArrowRight,
} from "lucide-react";

const pressReleases = [
  {
    date: "January 10, 2026",
    title: "Ntourage Raises $50M Series B to Expand Global Creator Network",
    excerpt:
      "Funding will accelerate international expansion and AI capabilities.",
  },
  {
    date: "December 5, 2025",
    title: "Ntourage Launches AI Trip Companion with Real-Time Translation",
    excerpt:
      "New AI assistant helps travelers communicate with local businesses in any language.",
  },
  {
    date: "October 18, 2025",
    title: "Ntourage Surpasses 50,000 Trips Planned on Platform",
    excerpt:
      "Milestone reflects growing demand for trusted group travel experiences.",
  },
  {
    date: "August 22, 2025",
    title: "Ntourage Partners with Tourism Boards in 30 Countries",
    excerpt:
      "Partnerships bring exclusive access and local expertise to travelers.",
  },
];

const mediaFeatures = [
  {
    outlet: "TechCrunch",
    title: "How Ntourage is Reimagining Group Travel",
    date: "January 2026",
    logo: "TC",
  },
  {
    outlet: "Travel + Leisure",
    title: "The Best New Apps for Planning Your 2026 Adventures",
    date: "December 2025",
    logo: "T+L",
  },
  {
    outlet: "Forbes",
    title: "Meet the Startup Making Influencer Travel Mainstream",
    date: "November 2025",
    logo: "F",
  },
  {
    outlet: "Condé Nast Traveler",
    title: "Why Background Checks Are the Future of Group Travel",
    date: "October 2025",
    logo: "CNT",
  },
  {
    outlet: "The Verge",
    title: "This AI Will Book Restaurants for You in Any Language",
    date: "September 2025",
    logo: "V",
  },
  {
    outlet: "Skift",
    title: "Creator Economy Meets Travel: Inside Ntourage's Model",
    date: "August 2025",
    logo: "S",
  },
];

const assets = [
  {
    icon: ImageIcon,
    title: "Logo Package",
    description: "Primary and secondary logos in various formats",
    format: "SVG, PNG, EPS",
  },
  {
    icon: ImageIcon,
    title: "Product Screenshots",
    description: "High-resolution app and platform images",
    format: "PNG, JPG",
  },
  {
    icon: ImageIcon,
    title: "Fact Sheet",
    description: "Key company stats, milestones, and leadership",
    format: "PDF",
  },
  {
    icon: ImageIcon,
    title: "B-Roll Footage",
    description: "Video clips of trips and platform features",
    format: "MP4, MOV",
  },
];

const stats = [
  { value: "50,000+", label: "Trips Planned" },
  { value: "120+", label: "Countries" },
  { value: "5,000+", label: "Active Creators" },
  { value: "$75M", label: "Total Funding" },
  { value: "150+", label: "Team Members" },
  { value: "4.9", label: "Average Rating" },
];

export default async function PressPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      <PageHeader
        badge="Press"
        title="Press & Media"
        description="News, resources, and contact information for journalists and media professionals."
      />

      {/* Stats Bar */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-bold mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-primary-foreground/80">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-serif text-3xl text-foreground">
              Press Releases
            </h2>
            <Button variant="outline">View All</Button>
          </div>

          <div className="space-y-4">
            {pressReleases.map((release) => (
              <Card
                key={release.title}
                className="bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">
                        {release.date}
                      </span>
                      <h3 className="font-semibold text-foreground mt-1 mb-2">
                        {release.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {release.excerpt}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0">
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Media Coverage */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl text-foreground mb-4">
              In the News
            </h2>
            <p className="text-muted-foreground">
              Recent coverage from leading publications
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mediaFeatures.map((feature) => (
              <Card
                key={feature.title}
                className="bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                      {feature.logo}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {feature.outlet}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {feature.date}
                      </p>
                    </div>
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <div className="flex items-center gap-1 mt-4 text-sm text-primary">
                    Read Article
                    <ExternalLink className="h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Media Assets */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl text-foreground mb-4">
              Media Assets
            </h2>
            <p className="text-muted-foreground">
              Download logos, screenshots, and other brand materials
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {assets.map((asset) => (
              <Card
                key={asset.title}
                className="bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-6 text-center">
                  <div className="p-4 rounded-lg bg-secondary/50 w-fit mx-auto mb-4">
                    <asset.icon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {asset.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {asset.description}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {asset.format}
                  </Badge>
                  <Button variant="ghost" size="sm" className="w-full mt-4">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button
              variant="outline"
              size="lg"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Full Press Kit
            </Button>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl text-foreground mb-4">
            Media Inquiries
          </h2>
          <p className="text-muted-foreground mb-8">
            For press inquiries, interview requests, or additional information,
            please contact our communications team.
          </p>
          <Card className="bg-card border border-border">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-primary">
                  <Mail className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                Press Contact
              </h3>
              <p className="text-muted-foreground mb-4">
                press@ntourage.travel
              </p>
              <p className="text-sm text-muted-foreground">
                We typically respond within 24 hours
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  );
}
