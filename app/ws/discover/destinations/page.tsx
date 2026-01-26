import { auth } from "@/auth";

import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { PageHeader } from "@/app/ws/components/page-header-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";

const regions = [
  {
    name: "Asia",
    description: "Ancient temples, bustling cities, and serene landscapes",
    image:
      "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80",
    destinations: [
      {
        name: "Japan",
        trips: 24,
        image:
          "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80",
      },
      {
        name: "Thailand",
        trips: 18,
        image:
          "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=400&q=80",
      },
      {
        name: "Vietnam",
        trips: 15,
        image:
          "https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=80",
      },
      {
        name: "Indonesia",
        trips: 21,
        image:
          "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80",
      },
    ],
  },
  {
    name: "Europe",
    description: "Rich history, stunning architecture, and diverse cultures",
    image:
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80",
    destinations: [
      {
        name: "Italy",
        trips: 32,
        image:
          "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=400&q=80",
      },
      {
        name: "Spain",
        trips: 19,
        image:
          "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80",
      },
      {
        name: "Portugal",
        trips: 14,
        image:
          "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400&q=80",
      },
      {
        name: "Greece",
        trips: 16,
        image:
          "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=400&q=80",
      },
    ],
  },
  {
    name: "Africa",
    description: "Untamed wilderness, vibrant cultures, and ancient wonders",
    image:
      "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&q=80",
    destinations: [
      {
        name: "Morocco",
        trips: 22,
        image:
          "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&q=80",
      },
      {
        name: "Tanzania",
        trips: 11,
        image:
          "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&q=80",
      },
      {
        name: "South Africa",
        trips: 13,
        image:
          "https://images.unsplash.com/photo-1484318571209-661cf29a69c3?w=400&q=80",
      },
      {
        name: "Egypt",
        trips: 9,
        image:
          "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=400&q=80",
      },
    ],
  },
  {
    name: "Americas",
    description: "From glaciers to rainforests, endless natural wonders",
    image:
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80",
    destinations: [
      {
        name: "Peru",
        trips: 17,
        image:
          "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400&q=80",
      },
      {
        name: "Costa Rica",
        trips: 14,
        image:
          "https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=400&q=80",
      },
      {
        name: "Chile",
        trips: 10,
        image:
          "https://images.unsplash.com/photo-1601000938259-9e92002320b2?w=400&q=80",
      },
      {
        name: "Mexico",
        trips: 19,
        image:
          "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=400&q=80",
      },
    ],
  },
];

export default async function DestinationsPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            badge="Destinations"
            title="Explore the World"
            description="From ancient temples to untamed wilderness, discover destinations that will transform the way you see the world."
          />
        </div>
      </section>

      {/* Regions */}
      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          {regions.map((region, index) => (
            <div key={region.name}>
              <div
                className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
              >
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                    <img
                      src={region.image || "/placeholder.svg"}
                      alt={region.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-6 left-6">
                      <h2 className="font-serif text-4xl text-white mb-2">
                        {region.name}
                      </h2>
                      <p className="text-white/80">{region.description}</p>
                    </div>
                  </div>
                </div>

                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <div className="grid grid-cols-2 gap-4">
                    {region.destinations.map((destination) => (
                      <Link
                        key={destination.name}
                        href={`/discover?destination=${destination.name.toLowerCase()}`}
                      >
                        <Card className="group overflow-hidden border border-border hover:shadow-md transition-shadow">
                          <div className="relative aspect-[3/2] overflow-hidden">
                            <img
                              src={destination.image || "/placeholder.svg"}
                              alt={destination.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-foreground">
                                  {destination.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {destination.trips} trips
                                </p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-muted">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            {"Don't see your dream destination?"}
          </h2>
          <p className="text-muted-foreground mb-8">
            Our AI trip planner can help you create a custom itinerary for
            anywhere in the world.
          </p>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
            <MapPin className="h-4 w-4 mr-2" />
            Plan a Custom Trip
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
