import { auth } from "@/auth";


import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { PageHeader } from "@/app/ws/components/page-header-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import { Badge } from "@/app/ws/ui/badge";
import {
  MapPin,
  Clock,
  Briefcase,
  Heart,
  Globe,
  Plane,
  Coffee,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

const benefits = [
  {
    icon: Plane,
    title: "Travel Stipend",
    description: "$5,000 annual travel budget to explore the world",
  },
  {
    icon: Globe,
    title: "Remote-First",
    description: "Work from anywhere with flexible hours",
  },
  {
    icon: Heart,
    title: "Health & Wellness",
    description: "Comprehensive health, dental, and vision coverage",
  },
  {
    icon: GraduationCap,
    title: "Learning Budget",
    description: "$2,000 yearly for courses, books, and conferences",
  },
  {
    icon: Coffee,
    title: "Team Retreats",
    description: "Quarterly team trips to amazing destinations",
  },
  {
    icon: Clock,
    title: "Unlimited PTO",
    description: "Take the time you need to recharge and explore",
  },
];

const departments = [
  { name: "Engineering", count: 8 },
  { name: "Product", count: 3 },
  { name: "Design", count: 2 },
  { name: "Marketing", count: 4 },
  { name: "Operations", count: 3 },
  { name: "Support", count: 5 },
];

const openings = [
  {
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description:
      "Build the core platform that powers millions of travel experiences worldwide.",
  },
  {
    title: "AI/ML Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description:
      "Develop our AI Trip Companion and personalization systems.",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    description:
      "Create beautiful, intuitive experiences for travelers and creators.",
  },
  {
    title: "Creator Success Manager",
    department: "Operations",
    location: "Remote",
    type: "Full-time",
    description:
      "Help our top creators build successful travel businesses.",
  },
  {
    title: "Growth Marketing Manager",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
    description:
      "Drive user acquisition and help more travelers discover Ntourage.",
  },
  {
    title: "Senior Mobile Engineer (React Native)",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description:
      "Build our mobile experience used by travelers around the globe.",
  },
  {
    title: "Content Strategist",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
    description:
      "Tell compelling stories about travel and our creator community.",
  },
  {
    title: "Trust & Safety Specialist",
    department: "Operations",
    location: "Remote",
    type: "Full-time",
    description:
      "Ensure our community stays safe and trustworthy for everyone.",
  },
];

export default async function CareersPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      <PageHeader
        badge="Careers"
        title="Build the Future of Travel"
        description="Join a passionate team of travelers creating technology that brings people together through shared adventures."
      />

      {/* Culture Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
                Work From Anywhere, Travel Everywhere
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                We're a remote-first company with team members across 15
                countries. We believe the best travel products are built by
                people who actually travel—that's why we give everyone a
                generous travel stipend and unlimited PTO to explore.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Every quarter, we come together in a new destination for our
                team retreat. Past locations include Bali, Portugal, Japan, and
                Morocco. It's not just about work—it's about experiencing the
                magic we're building for others.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&h=200&fit=crop"
                alt="Team collaboration"
                className="rounded-lg object-cover w-full h-40"
              />
              <img
                src="https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=300&h=200&fit=crop"
                alt="Team retreat"
                className="rounded-lg object-cover w-full h-40"
              />
              <img
                src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=300&h=200&fit=crop"
                alt="Working together"
                className="rounded-lg object-cover w-full h-40"
              />
              <img
                src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=300&h=200&fit=crop"
                alt="Team adventure"
                className="rounded-lg object-cover w-full h-40"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Benefits & Perks
            </h2>
            <p className="text-muted-foreground">
              We take care of our team so they can take care of our travelers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="bg-card border border-border">
                <CardContent className="p-6">
                  <div className="p-3 rounded-lg bg-primary w-fit mb-4">
                    <benefit.icon className="h-5 w-5 text-primary-foreground" />
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

      {/* Open Positions */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Open Positions
            </h2>
            <p className="text-muted-foreground mb-8">
              {openings.length} roles across {departments.length} teams
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-12">
              <Badge
                variant="secondary"
                className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                All Departments
              </Badge>
              {departments.map((dept) => (
                <Badge
                  key={dept.name}
                  variant="outline"
                  className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {dept.name} ({dept.count})
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {openings.map((job) => (
              <Card
                key={job.title}
                className="bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg mb-1">
                        {job.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {job.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Briefcase className="h-3.5 w-3.5" />
                          {job.department}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {job.type}
                        </span>
                      </div>
                    </div>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                      Apply Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            Don't See the Right Role?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            We're always looking for talented people who are passionate about
            travel. Send us your resume and tell us how you'd contribute.
          </p>
          <Button
            size="lg"
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
          >
            Send General Application
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
