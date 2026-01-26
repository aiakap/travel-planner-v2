import { auth } from "@/auth";

import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { PageHeader } from "@/app/ws/components/page-header-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import { Badge } from "@/app/ws/ui/badge";
import {
  Star,
  MapPin,
  Calendar,
  Users,
  Clock,
  Filter,
  Search,
  ChevronRight,
  Shield,
} from "lucide-react";
import { Input } from "@/app/ws/ui/input";
import { Suspense } from "react";
import Loading from "./loading";

const trips = [
  {
    id: 1,
    title: "Mystical Morocco",
    subtitle: "A Journey Through Ancient Medinas",
    location: "Marrakech, Morocco",
    image:
      "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800&q=80",
    duration: "10 days",
    groupSize: "8-12",
    price: 2499,
    rating: 4.9,
    reviews: 127,
    guide: {
      name: "Sarah Chen",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
      verified: true,
    },
    dates: "Mar 15 - Mar 25, 2026",
    spotsLeft: 4,
    tags: ["Culture", "Adventure", "Photography"],
  },
  {
    id: 2,
    title: "Japanese Spring",
    subtitle: "Cherry Blossoms & Hidden Temples",
    location: "Kyoto, Japan",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
    duration: "12 days",
    groupSize: "6-10",
    price: 3299,
    rating: 5.0,
    reviews: 89,
    guide: {
      name: "Yuki Tanaka",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
      verified: true,
    },
    dates: "Apr 1 - Apr 12, 2026",
    spotsLeft: 2,
    tags: ["Nature", "Culture", "Food"],
  },
  {
    id: 3,
    title: "Patagonian Wilderness",
    subtitle: "Glaciers, Mountains & Endless Horizons",
    location: "Torres del Paine, Chile",
    image:
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80",
    duration: "14 days",
    groupSize: "6-8",
    price: 4199,
    rating: 4.8,
    reviews: 64,
    guide: {
      name: "Marco Silva",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
      verified: true,
    },
    dates: "Nov 10 - Nov 24, 2026",
    spotsLeft: 6,
    tags: ["Hiking", "Nature", "Wildlife"],
  },
  {
    id: 4,
    title: "Tuscan Escape",
    subtitle: "Wine, Art & Italian Countryside",
    location: "Florence, Italy",
    image:
      "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800&q=80",
    duration: "8 days",
    groupSize: "8-12",
    price: 2899,
    rating: 4.9,
    reviews: 156,
    guide: {
      name: "Isabella Romano",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
      verified: true,
    },
    dates: "May 5 - May 12, 2026",
    spotsLeft: 3,
    tags: ["Food", "Wine", "Art"],
  },
  {
    id: 5,
    title: "Northern Lights Quest",
    subtitle: "Arctic Adventure in Norway",
    location: "Tromsø, Norway",
    image:
      "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
    duration: "7 days",
    groupSize: "6-10",
    price: 3599,
    rating: 4.7,
    reviews: 82,
    guide: {
      name: "Erik Hansen",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
      verified: true,
    },
    dates: "Feb 1 - Feb 7, 2026",
    spotsLeft: 5,
    tags: ["Nature", "Photography", "Adventure"],
  },
  {
    id: 6,
    title: "Bali Bliss",
    subtitle: "Temples, Rice Terraces & Beaches",
    location: "Ubud, Bali",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    duration: "11 days",
    groupSize: "8-14",
    price: 2199,
    rating: 4.8,
    reviews: 203,
    guide: {
      name: "Made Wijaya",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80",
      verified: true,
    },
    dates: "Jun 10 - Jun 20, 2026",
    spotsLeft: 8,
    tags: ["Wellness", "Culture", "Beach"],
  },
];

const categories = [
  "All Trips",
  "Adventure",
  "Culture",
  "Food & Wine",
  "Nature",
  "Photography",
  "Wellness",
];

export default async function DiscoverPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            badge="Discover"
            title="Find Your Next Adventure"
            description="Browse curated trips led by verified guides. Every journey is thoughtfully designed with authentic experiences, local insights, and seamless support."
          />

          {/* Search and Filter */}
          <div className="mt-12 flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search destinations, trips, or guides..."
                className="pl-10 h-12 bg-background border-border"
              />
            </div>
            <Button variant="outline" className="h-12 px-6 gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Categories */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {categories.map((category, index) => (
              <Button
                key={category}
                variant={index === 0 ? "default" : "outline"}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Trip Grid */}
      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<Loading />}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trips.map((trip) => (
                <Card
                  key={trip.id}
                  className="group bg-card border border-border overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={trip.image || "/placeholder.svg"}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      {trip.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          className="bg-white/90 text-foreground backdrop-blur-sm"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    {trip.spotsLeft <= 4 && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-rose-500 text-white">
                          {trip.spotsLeft} spots left
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      {trip.location}
                    </div>

                    <h3 className="font-serif text-xl text-foreground mb-1">
                      {trip.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {trip.subtitle}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {trip.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {trip.groupSize}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {trip.dates.split(",")[0]}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={trip.guide.image || "/placeholder.svg"}
                            alt={trip.guide.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          {trip.guide.verified && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <Shield className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {trip.guide.name}
                          </p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs text-muted-foreground">
                              {trip.rating} ({trip.reviews})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-semibold text-foreground">
                          ${trip.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">per person</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Suspense>

          <div className="mt-12 text-center">
            <Button variant="outline" className="gap-2 bg-transparent">
              Load More Trips
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
