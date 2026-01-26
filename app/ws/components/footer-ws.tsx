"use client";

import Link from "next/link";

const footerLinks = {
  planTrip: {
    title: "Plan a Trip",
    links: [
      { label: "Start Planning", href: "/ws/plan" },
      { label: "Solo Adventure", href: "/ws/plan/solo" },
      { label: "Family Trip", href: "/ws/plan/family" },
      { label: "Friends Getaway", href: "/ws/plan/friends" },
    ],
  },
  discover: {
    title: "Discover",
    links: [
      { label: "Browse Trips", href: "/ws/discover" },
      { label: "Destinations", href: "/ws/discover/destinations" },
      { label: "How It Works", href: "/ws/discover/how-it-works" },
    ],
  },
  forCreators: {
    title: "For Creators",
    links: [
      { label: "Become a Guide", href: "/ws/creators" },
      { label: "Influencer Trips", href: "/ws/creators/influencers" },
      { label: "Creator Tools", href: "/ws/creators/tools" },
      { label: "Earnings", href: "/ws/creators/earnings" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { label: "AI Trip Support", href: "/ws/support/ai" },
      { label: "24/7 Team", href: "/ws/support/team" },
      { label: "Local Concierges", href: "/ws/support/concierges" },
      { label: "Help Center", href: "/ws/support/help" },
    ],
  },
  about: {
    title: "About",
    links: [
      { label: "Our Story", href: "/ws/about" },
      { label: "Careers", href: "/ws/about/careers" },
      { label: "Blog", href: "/ws/about/blog" },
      { label: "Press", href: "/ws/about/press" },
    ],
  },
};

export function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/ws" className="flex items-center mb-4">
              <span className="text-lg font-semibold text-foreground tracking-tight">
                Ntourage
              </span>
              <span className="text-lg text-muted-foreground font-light tracking-tight">
                .travel
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Travel together, seamlessly. AI-powered trip planning with human
              support.
            </p>
          </div>

          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="font-semibold text-foreground text-sm mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 Ntourage.travel. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cookie Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
