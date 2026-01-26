import { auth } from "@/auth";


import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { PageHeader } from "@/app/ws/components/page-header-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import { Badge } from "@/app/ws/ui/badge";
import { Input } from "@/app/ws/ui/input";
import { Search, Clock, ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading";

const categories = [
  "All",
  "Travel Tips",
  "Creator Stories",
  "Product Updates",
  "Destinations",
  "Company News",
];

const featuredPost = {
  title: "How We Built an AI That Speaks to Local Restaurants For You",
  excerpt:
    "A deep dive into the technology behind our AI Trip Companion and how it helps travelers communicate across language barriers.",
  category: "Product Updates",
  author: "Sarah Chen",
  authorRole: "CEO",
  date: "January 15, 2026",
  readTime: "8 min read",
  image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop",
};

const posts = [
  {
    title: "10 Lessons from Leading 50 Group Trips",
    excerpt:
      "Creator Maya Rodriguez shares what she's learned from taking thousands of travelers to South America.",
    category: "Creator Stories",
    author: "Maya Rodriguez",
    date: "January 12, 2026",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=400&h=250&fit=crop",
  },
  {
    title: "The Rise of Trust-First Travel Platforms",
    excerpt:
      "Why background checks and verified profiles are becoming the new standard in group travel.",
    category: "Travel Tips",
    author: "David Okonkwo",
    date: "January 10, 2026",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop",
  },
  {
    title: "Hidden Gems: 7 Underrated Destinations for 2026",
    excerpt:
      "Skip the crowds and discover these incredible places our creators are raving about.",
    category: "Destinations",
    author: "Yuki Tanaka",
    date: "January 8, 2026",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=250&fit=crop",
  },
  {
    title: "Announcing 24/7 Support in 40+ Languages",
    excerpt:
      "Our human support team now covers every time zone and speaks your language, wherever you travel.",
    category: "Company News",
    author: "Marcus Thompson",
    date: "January 5, 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=250&fit=crop",
  },
  {
    title: "From Follower to Traveler: Converting Your Audience",
    excerpt:
      "Influencer tips on turning social media engagement into real-world travel experiences.",
    category: "Creator Stories",
    author: "Alex Kim",
    date: "January 3, 2026",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=250&fit=crop",
  },
  {
    title: "Planning a Multigenerational Trip? Here's How",
    excerpt:
      "Tips for organizing travel that works for grandparents, parents, and kids alike.",
    category: "Travel Tips",
    author: "Elena Vasquez",
    date: "December 28, 2025",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=250&fit=crop",
  },
];

export default async function BlogPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      <PageHeader
        badge="Blog"
        title="Stories & Insights"
        description="Travel tips, creator stories, and the latest from the Ntourage team."
      />

      {/* Search & Filter */}
      <section className="py-8 border-b border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                className="pl-10 bg-secondary/50 border-border"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category, index) => (
                <Badge
                  key={category}
                  variant={index === 0 ? "default" : "outline"}
                  className={`px-4 py-2 cursor-pointer transition-colors ${
                    index === 0
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <Card className="bg-card border border-border overflow-hidden">
            <div className="grid lg:grid-cols-2">
              <div className="relative h-64 lg:h-auto">
                <img
                  src={featuredPost.image || "/placeholder.svg"}
                  alt={featuredPost.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-8 lg:p-12 flex flex-col justify-center">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 w-fit mb-4">
                  {featuredPost.category}
                </Badge>
                <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
                  {featuredPost.title}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {featuredPost.author}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {featuredPost.authorRole}
                      </p>
                    </div>
                  </div>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">
                    {featuredPost.date}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {featuredPost.readTime}
                  </span>
                </div>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-fit">
                  Read Article
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </div>
          </Card>
        </div>
      </section>

      {/* Post Grid */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-serif text-2xl text-foreground mb-8">
            Latest Articles
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card
                key={post.title}
                className="bg-card border border-border overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.image || "/placeholder.svg"}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <Badge
                    variant="outline"
                    className="mb-3 text-xs"
                  >
                    {post.category}
                  </Badge>
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{post.author}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Articles
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl text-foreground mb-4">
            Get Travel Insights Weekly
          </h2>
          <p className="text-muted-foreground mb-8">
            Join 25,000+ travelers receiving our best tips, creator stories, and
            destination inspiration every week.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-background border-border"
            />
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Subscribe
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            No spam, unsubscribe anytime
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Loading() {
  return null;
}
