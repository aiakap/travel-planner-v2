"use client";

import React from "react";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Session } from "next-auth";
import { Button } from "@/app/ws/ui/button";
import { UserMenuWS } from "@/app/ws/components/user-menu-ws";
import {
  Menu,
  X,
  ChevronDown,
  Compass,
  Users,
  MapPin,
  Sparkles,
  Bot,
  Headphones,
  UserCheck,
  Globe,
  BookOpen,
  Briefcase,
  Heart,
  Newspaper,
  HelpCircle,
  DollarSign,
  Wrench,
  User,
  UsersRound,
  Calendar,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  children?: {
    label: string;
    href: string;
    description: string;
    icon: React.ReactNode;
  }[];
}

const navItems: NavItem[] = [
  {
    label: "Plan a Trip",
    href: "/ws/plan",
    children: [
      {
        label: "Start Planning",
        href: "/ws/plan",
        description: "Create your perfect trip",
        icon: <Calendar className="h-5 w-5" />,
      },
      {
        label: "Solo Adventure",
        href: "/ws/plan/solo",
        description: "Travel on your own terms",
        icon: <User className="h-5 w-5" />,
      },
      {
        label: "Family Trip",
        href: "/ws/plan/family",
        description: "Adventures for all ages",
        icon: <Heart className="h-5 w-5" />,
      },
      {
        label: "Friends Getaway",
        href: "/ws/plan/friends",
        description: "Vote, split costs, and travel together",
        icon: <UsersRound className="h-5 w-5" />,
      },
    ],
  },
  {
    label: "Discover",
    href: "/ws/discover",
    children: [
      {
        label: "Browse Trips",
        href: "/ws/discover",
        description: "Explore curated trips worldwide",
        icon: <Compass className="h-5 w-5" />,
      },
      {
        label: "Destinations",
        href: "/ws/discover/destinations",
        description: "Find your next adventure by location",
        icon: <MapPin className="h-5 w-5" />,
      },
      {
        label: "How It Works",
        href: "/ws/discover/how-it-works",
        description: "Learn about the Ntourage experience",
        icon: <HelpCircle className="h-5 w-5" />,
      },
    ],
  },
  {
    label: "For Creators",
    href: "/ws/creators",
    children: [
      {
        label: "Become a Guide",
        href: "/ws/creators",
        description: "Lead trips and earn income",
        icon: <Users className="h-5 w-5" />,
      },
      {
        label: "Influencer Trips",
        href: "/ws/creators/influencers",
        description: "Take your audience on custom trips",
        icon: <Sparkles className="h-5 w-5" />,
      },
      {
        label: "Creator Tools",
        href: "/ws/creators/tools",
        description: "Everything you need to succeed",
        icon: <Wrench className="h-5 w-5" />,
      },
      {
        label: "Earnings",
        href: "/ws/creators/earnings",
        description: "How guides get paid",
        icon: <DollarSign className="h-5 w-5" />,
      },
    ],
  },
  {
    label: "Support",
    href: "/ws/support",
    children: [
      {
        label: "AI Trip Support",
        href: "/ws/support/ai",
        description: "Your free AI travel companion",
        icon: <Bot className="h-5 w-5" />,
      },
      {
        label: "24/7 Human Team",
        href: "/ws/support/team",
        description: "Multilingual support anytime",
        icon: <Headphones className="h-5 w-5" />,
      },
      {
        label: "Local Concierges",
        href: "/ws/support/concierges",
        description: "On-the-ground guides for your trip",
        icon: <UserCheck className="h-5 w-5" />,
      },
      {
        label: "Help Center",
        href: "/ws/support/help",
        description: "FAQs and resources",
        icon: <Globe className="h-5 w-5" />,
      },
    ],
  },
  {
    label: "About",
    href: "/ws/about",
    children: [
      {
        label: "Our Story",
        href: "/ws/about",
        description: "Learn about Ntourage",
        icon: <BookOpen className="h-5 w-5" />,
      },
      {
        label: "Careers",
        href: "/ws/about/careers",
        description: "Join our team",
        icon: <Briefcase className="h-5 w-5" />,
      },
      {
        label: "Trust & Safety",
        href: "/ws/about/trust",
        description: "How we keep you safe",
        icon: <Heart className="h-5 w-5" />,
      },
      {
        label: "Blog",
        href: "/ws/about/blog",
        description: "Travel stories and tips",
        icon: <Newspaper className="h-5 w-5" />,
      },
    ],
  },
];

function NavDropdown({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="flex items-center gap-1 text-sm text-foreground hover:text-muted-foreground transition-colors py-2"
        onClick={() => setOpen(!open)}
      >
        {item.label}
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && item.children && (
        <div className="absolute top-full left-0 pt-2 w-72">
          <div className="bg-background border border-border rounded-lg shadow-lg overflow-hidden">
            <div className="p-2">
              {item.children.map((child) => (
                <Link
                  key={child.label}
                  href={child.href}
                  className="flex items-start gap-3 p-3 rounded-md hover:bg-muted transition-colors group"
                  onClick={() => setOpen(false)}
                >
                  <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-colors">
                    {child.icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-foreground">
                      {child.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {child.description}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileNavItem({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        className="flex items-center justify-between w-full py-3 text-foreground"
        onClick={() => setOpen(!open)}
      >
        <span>{item.label}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && item.children && (
        <div className="pb-3 space-y-1">
          {item.children.map((child) => (
            <Link
              key={child.label}
              href={child.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
            >
              <div className="p-1.5 rounded-md bg-muted text-muted-foreground">
                {child.icon}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  {child.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {child.description}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

interface NavigationProps {
  session: Session | null;
}

export function Navigation({ session }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/ws" className="flex items-center">
            <span className="text-lg font-semibold text-foreground tracking-tight">
              Ntourage
            </span>
            <span className="text-lg text-muted-foreground font-light tracking-tight">
              .travel
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <NavDropdown key={item.label} item={item} />
            ))}
          </div>

      <div className="hidden md:flex items-center gap-3">
        {session ? (
          <UserMenuWS />
        ) : (
          <>
            <Button
              variant="ghost"
              className="text-foreground hover:text-muted-foreground"
              asChild
            >
              <Link href="/login">Log In</Link>
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-5"
              asChild
            >
              <Link href="/ws/plan">Plan a Trip</Link>
            </Button>
          </>
        )}
      </div>

          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <div className="space-y-0">
              {navItems.map((item) => (
                <MobileNavItem key={item.label} item={item} />
              ))}
            </div>
            <div className="pt-4 mt-4 border-t border-border flex flex-col gap-2">
              {session ? (
                <div className="flex justify-center">
                  <UserMenuWS />
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-center text-foreground"
                    asChild
                  >
                    <Link href="/login">Log In</Link>
                  </Button>
                  <Button className="w-full bg-primary text-primary-foreground" asChild>
                    <Link href="/ws/plan">Plan a Trip</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
