import { auth } from "@/auth";

import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { PageHeader } from "@/app/ws/components/page-header-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import {
  Headphones,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  Globe,
  Shield,
  Star,
  Languages,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

const supportChannels = [
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Instant messaging with our support team",
    availability: "24/7",
    responseTime: "< 2 minutes",
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "Talk directly to a support specialist",
    availability: "24/7",
    responseTime: "Immediate",
  },
  {
    icon: Mail,
    title: "Email",
    description: "Detailed inquiries and documentation",
    availability: "24/7",
    responseTime: "< 4 hours",
  },
];

const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Japanese",
  "Mandarin",
  "Korean",
  "Arabic",
  "Hindi",
  "Russian",
];

const teamMembers = [
  {
    name: "Maria Santos",
    role: "Senior Support Lead",
    languages: ["English", "Spanish", "Portuguese"],
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    specialties: ["Latin America", "Emergency Response"],
  },
  {
    name: "Kenji Yamamoto",
    role: "Asia Pacific Specialist",
    languages: ["English", "Japanese", "Mandarin"],
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    specialties: ["Japan", "Cultural Experiences"],
  },
  {
    name: "Sophie Laurent",
    role: "Europe Specialist",
    languages: ["English", "French", "Italian", "German"],
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    specialties: ["Europe", "Luxury Travel"],
  },
  {
    name: "Ahmed Hassan",
    role: "Middle East & Africa Lead",
    languages: ["English", "Arabic", "French"],
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    specialties: ["Morocco", "Egypt", "Adventure Travel"],
  },
];

const emergencyServices = [
  "Medical emergency coordination",
  "Lost passport assistance",
  "Flight rebooking",
  "Emergency evacuation support",
  "Local authority liaison",
  "Family notification",
];

export default async function TeamPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            badge="24/7 Human Team"
            title="Real People, Real Help"
            description="Our multilingual support team is available around the clock. Whether it's 3am or 3pm, complex problems or simple questions—we're here."
          />
        </div>
      </section>

      {/* Support Channels */}
      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {supportChannels.map((channel) => (
              <Card
                key={channel.title}
                className="bg-card border border-border text-center"
              >
                <CardContent className="p-6">
                  <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                    <channel.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {channel.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {channel.description}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <p>{channel.availability}</p>
                    <p className="text-primary font-medium">
                      {channel.responseTime}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Languages */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 mb-5">
                <Languages className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">
                  Multilingual Support
                </span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
                We Speak Your Language
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Our global team covers 40+ languages, ensuring you can always
                communicate comfortably—even in stressful situations.
              </p>
              <p className="text-sm text-muted-foreground">
                Most popular languages with native speakers on staff:
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {languages.map((language) => (
                <span
                  key={language}
                  className="px-3 py-1.5 bg-background border border-border rounded-full text-sm text-foreground"
                >
                  {language}
                </span>
              ))}
              <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                +28 more
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Meet Some of Our Team
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Travel experts and support specialists ready to help
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <Card
                key={member.name}
                className="bg-card border border-border overflow-hidden"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={member.image || "/placeholder.svg"}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground">
                    {member.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {member.role}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {member.languages.map((lang) => (
                      <span
                        key={lang}
                        className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Specialties: {member.specialties.join(", ")}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Support */}
      <section className="py-24 px-6 bg-rose-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-rose-500/10 mb-5">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <span className="text-sm text-rose-500 font-medium">
                  Emergency Support
                </span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
                When Things Go Wrong
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Emergencies don't follow schedules. Our emergency response team
                is trained to handle critical situations anywhere in the world,
                coordinating with local authorities and services on your behalf.
              </p>
              <Button className="bg-rose-500 text-white hover:bg-rose-600">
                <Phone className="h-4 w-4 mr-2" />
                Emergency Line: +1-800-NTOURAGE
              </Button>
            </div>
            <div>
              <Card className="bg-white border border-rose-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">
                    Emergency Services Include:
                  </h3>
                  <ul className="space-y-3">
                    {emergencyServices.map((service) => (
                      <li key={service} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-rose-500 mt-0.5" />
                        <span className="text-foreground">{service}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            Want On-the-Ground Help?
          </h2>
          <p className="text-muted-foreground mb-8">
            Sometimes you need someone physically there. Explore our local
            concierge services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
              asChild
            >
              <Link href="/support/concierges">Local Concierges</Link>
            </Button>
            <Button variant="outline" className="px-8 bg-transparent">
              <MessageCircle className="h-4 w-4 mr-2" />
              Start a Chat
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
