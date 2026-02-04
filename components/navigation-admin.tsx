"use client";

import React from "react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  FileText,
  TestTube,
  Plug,
  Map,
  Plane,
  Bot,
  Image as ImageIcon,
  Upload,
  ArrowLeft,
  Mail,
  Trash2,
  Database,
  Code,
  MapPin,
  Dice5,
  Clock,
  Brain,
  Cloud,
  Utensils,
  Ticket,
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

const adminNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
  },
  {
    label: "Plugins",
    href: "/admin/prompts",
    children: [
      {
        label: "Manage Plugins",
        href: "/admin/prompts",
        description: "View and configure prompt plugins",
        icon: <FileText className="h-5 w-5" />,
      },
      {
        label: "Test Prompts",
        href: "/admin/prompts/test",
        description: "Build and preview prompts",
        icon: <TestTube className="h-5 w-5" />,
      },
    ],
  },
  {
    label: "APIs",
    href: "/admin/apis",
    children: [
      {
        label: "API Overview",
        href: "/admin/apis",
        description: "View all API integrations",
        icon: <Plug className="h-5 w-5" />,
      },
      {
        label: "Google Maps",
        href: "/admin/apis/google-maps",
        description: "Test Maps, Places, and Routes",
        icon: <Map className="h-5 w-5" />,
      },
      {
        label: "Amadeus",
        href: "/admin/apis/amadeus",
        description: "Test flight and hotel search",
        icon: <Plane className="h-5 w-5" />,
      },
      {
        label: "OpenAI",
        href: "/admin/apis/openai",
        description: "Test GPT-4o completions",
        icon: <Bot className="h-5 w-5" />,
      },
      {
        label: "Imagen",
        href: "/admin/apis/imagen",
        description: "Test AI image generation",
        icon: <ImageIcon className="h-5 w-5" />,
      },
      {
        label: "Weather",
        href: "/admin/apis/weather",
        description: "Test weather forecasts",
        icon: <Cloud className="h-5 w-5" />,
      },
      {
        label: "Restaurants",
        href: "/admin/apis/restaurants",
        description: "Test Yelp restaurant search",
        icon: <Utensils className="h-5 w-5" />,
      },
      {
        label: "Activities",
        href: "/admin/apis/activities",
        description: "Test Viator tours & activities",
        icon: <Ticket className="h-5 w-5" />,
      },
    ],
  },
  {
    label: "Tools",
    href: "/admin/travel-extraction",
    children: [
      {
        label: "Email Extraction",
        href: "/admin/email-extract",
        description: "Extract booking info from emails",
        icon: <Mail className="h-5 w-5" />,
      },
      {
        label: "Travel Extraction",
        href: "/admin/travel-extraction",
        description: "Queue-based batch extraction",
        icon: <Upload className="h-5 w-5" />,
      },
      {
        label: "Seed Trips",
        href: "/admin/seed-trips",
        description: "Generate test trips with real data",
        icon: <Database className="h-5 w-5" />,
      },
      {
        label: "User Cleanup",
        href: "/admin/user-cleanup",
        description: "Search and manage user data",
        icon: <Trash2 className="h-5 w-5" />,
      },
    ],
  },
  {
    label: "Dev Testing",
    href: "/admin/cards",
    children: [
      {
        label: "Card Explorer",
        href: "/admin/cards",
        description: "View card type schemas",
        icon: <Code className="h-5 w-5" />,
      },
      {
        label: "Suggestions",
        href: "/admin/suggestions",
        description: "Test suggestion schemas",
        icon: <MapPin className="h-5 w-5" />,
      },
      {
        label: "Get Lucky Test",
        href: "/admin/get-lucky-test",
        description: "Debug surprise trip feature",
        icon: <Dice5 className="h-5 w-5" />,
      },
      {
        label: "Timezone Test",
        href: "/admin/timezone-test",
        description: "Test date/timezone conversions",
        icon: <Clock className="h-5 w-5" />,
      },
      {
        label: "Trip Intelligence",
        href: "/admin/trip-intelligence",
        description: "Test trip intelligence features",
        icon: <Brain className="h-5 w-5" />,
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

  // If no children, render as a simple link
  if (!item.children) {
    return (
      <Link
        href={item.href}
        className="flex items-center gap-1 text-sm text-foreground hover:text-muted-foreground transition-colors py-2"
      >
        {item.label}
      </Link>
    );
  }

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

  // If no children, render as a simple link
  if (!item.children) {
    return (
      <div className="border-b border-border last:border-b-0">
        <Link
          href={item.href}
          className="block w-full py-3 text-foreground hover:bg-muted rounded-md transition-colors"
        >
          {item.label}
        </Link>
      </div>
    );
  }

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

export default function NavigationAdmin() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center">
            <span className="text-lg font-semibold text-foreground tracking-tight">
              Ntourage
            </span>
            <span className="text-lg text-muted-foreground font-light tracking-tight">
              .travel
            </span>
            <span className="ml-2 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
              Admin
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {adminNavItems.map((item) => (
              <NavDropdown key={item.label} item={item} />
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-foreground hover:text-muted-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to App
            </Link>
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
              {adminNavItems.map((item) => (
                <MobileNavItem key={item.label} item={item} />
              ))}
            </div>
            <div className="pt-4 mt-4 border-t border-border">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full py-3 text-center text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to App
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
