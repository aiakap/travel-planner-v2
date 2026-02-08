"use client";

import React from "react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Session } from "next-auth";
import {
  Menu,
  X,
  ChevronDown,
  Compass,
  MapPin,
  Clock,
  Plus,
  Sparkles,
  Lightbulb,
  Globe,
  Database,
  User,
  BookOpen,
  Settings,
} from "lucide-react";
import { UserMenu } from "@/components/user-menu";
import { TestMenu } from "@/components/test-menu";
import { UserContextIcon } from "@/components/user-context-icon";
import { getMinimalUserContext } from "@/lib/actions/user-context";
// TripBuilderModal replaced with full-page JourneyManager at /trip/new

interface NavItem {
  label: string;
  href: string;
  children?: {
    label: string;
    href: string;
    description: string;
    icon: React.ReactNode;
    action?: string;
  }[];
}

const loggedInNavItems: NavItem[] = [
  {
    label: "My Journeys",
    href: "/manage1",
    children: [
      {
        label: "All Journeys",
        href: "/manage1",
        description: "View all your journeys",
        icon: <Compass className="h-5 w-5" />,
      },
      {
        label: "Active",
        href: "/manage1?filter=active",
        description: "Currently in progress",
        icon: <MapPin className="h-5 w-5" />,
      },
      {
        label: "Past",
        href: "/manage1?filter=past",
        description: "Completed journeys",
        icon: <Clock className="h-5 w-5" />,
      },
      {
        label: "Experience Builder",
        href: "/exp",
        description: "Create experiences",
        icon: <Sparkles className="h-5 w-5" />,
      },
    ],
  },
  {
    label: "Discover",
    href: "/suggestions",
    children: [
      {
        label: "AI Ideas",
        href: "/suggestions",
        description: "Personalized suggestions",
        icon: <Lightbulb className="h-5 w-5" />,
      },
      {
        label: "Globe",
        href: "/globe",
        description: "Visual exploration",
        icon: <Globe className="h-5 w-5" />,
      },
    ],
  },
  {
    label: "Profile",
    href: "/profile1",
    children: [
      {
        label: "Settings",
        href: "/profile1",
        description: "Account preferences",
        icon: <Settings className="h-5 w-5" />,
      },
      {
        label: "Dossier",
        href: "/profile1#dossier",
        description: "Your travel profile",
        icon: <BookOpen className="h-5 w-5" />,
      },
      {
        label: "Data",
        href: "/object",
        description: "Travel data system",
        icon: <Database className="h-5 w-5" />,
      },
    ],
  },
];

// CTA button for creating new journeys
const ctaButton = {
  label: "New Journey",
  href: "/trip/new",
  icon: <Plus className="h-4 w-4" />,
};

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

interface NavigationMainProps {
  session: Session | null;
  userContext?: Awaited<ReturnType<typeof getMinimalUserContext>>;
}

export default function NavigationMain({ session, userContext }: NavigationMainProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <span className="text-lg font-semibold text-foreground tracking-tight">
                Ntourage
              </span>
              <span className="text-lg text-muted-foreground font-light tracking-tight">
                .travel
              </span>
            </Link>

            {session ? (
              <>
                <div className="hidden md:flex items-center gap-6">
                  {loggedInNavItems.map((item) => (
                    <NavDropdown key={item.label} item={item} />
                  ))}
                </div>

                <div className="hidden md:flex items-center gap-3">
                  <Link
                    href={ctaButton.href}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
                  >
                    {ctaButton.icon}
                    {ctaButton.label}
                  </Link>
                  <TestMenu />
                  <UserContextIcon userContext={userContext || null} />
                  <UserMenu 
                    userName={session.user?.name}
                    userEmail={session.user?.email}
                    userImage={session.user?.image}
                  />
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/auth/welcome"
                  className="px-4 py-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/welcome"
                  className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}

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
              {session ? (
                <>
                  {/* Mobile CTA Button */}
                  <Link
                    href={ctaButton.href}
                    className="flex items-center justify-center gap-2 w-full py-3 mb-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {ctaButton.icon}
                    {ctaButton.label}
                  </Link>
                  <div className="space-y-0">
                    {loggedInNavItems.map((item) => (
                      <MobileNavItem key={item.label} item={item} />
                    ))}
                  </div>
                  <div className="pt-4 mt-4 border-t border-border flex items-center justify-center gap-3">
                    <TestMenu />
                    <UserContextIcon userContext={userContext || null} />
                    <UserMenu 
                      userName={session.user?.name}
                      userEmail={session.user?.email}
                      userImage={session.user?.image}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/auth/welcome"
                    className="block w-full py-3 text-center text-foreground hover:bg-muted rounded-md transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/auth/welcome"
                    className="block w-full py-3 text-center bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

    </>
  );
}
