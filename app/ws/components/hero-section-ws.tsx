"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/ws/ui/button";
import {
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Bookmark,
  FolderHeart,
  RefreshCw,
  Map,
  Layers,
  CalendarCheck,
  Mail,
  Smartphone,
  FileText,
  Bot,
  Headphones,
  UserCheck,
  Users,
  Shield,
  ChevronRight,
} from "lucide-react";

const steps = [
  {
    id: 1,
    category: "Getting Started",
    icon: MessageSquare,
    title: "Chat with your AI assistant",
    description:
      "Describe your dream trip in natural language. The AI understands your preferences for food, culture, adventure, and budget.",
    mockup: "chat",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1920&q=80", // Kyoto temple
  },
  {
    id: 2,
    category: "Getting Started",
    icon: Sparkles,
    title: "Get curated suggestions",
    description:
      "Receive handpicked recommendations for restaurants, hotels, activities, and hidden gems. Add them to your trip or save for later.",
    mockup: "suggestions",
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&q=80", // Beach paradise
  },
  {
    id: 3,
    category: "Getting Started",
    icon: Bookmark,
    title: "Three ways to save",
    description:
      "Organize items as Suggestions (ideas to explore), Plans (no reservation needed), or Reservations (confirmed bookings).",
    mockup: "save",
    image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1920&q=80", // Moroccan market
  },
  {
    id: 4,
    category: "Organizing",
    icon: FolderHeart,
    title: "Build your scrapbook",
    description:
      "Save ideas you love but aren't ready to book. Perfect for future trips or backup options when plans change.",
    mockup: "scrapbook",
    image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1920&q=80", // Venice canals
  },
  {
    id: 5,
    category: "Organizing",
    icon: RefreshCw,
    title: "Refine as you go",
    description:
      "Click any item in your itinerary to bring it back into chat. Update details, get alternatives, or ask follow-up questions.",
    mockup: "refine",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=80", // Paris Eiffel
  },
  {
    id: 6,
    category: "Organizing",
    icon: Map,
    title: "Manage multiple trips",
    description:
      "Plan as many adventures as you want. Each trip lives in its own space with dedicated AI context and history.",
    mockup: "trips",
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80", // Mountain lake
  },
  {
    id: 7,
    category: "Structure",
    icon: Layers,
    title: "Organize by segments",
    description:
      "Break trips into logical segments - cities, regions, or travel days. Perfect for multi-destination journeys.",
    mockup: "segments",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=80", // Tokyo skyline
  },
  {
    id: 8,
    category: "Structure",
    icon: CalendarCheck,
    title: "Track every reservation",
    description:
      "Hotels, restaurants, tours, flights - every booking has its place with confirmation codes, times, and status at a glance.",
    mockup: "reservations",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80", // Luxury hotel
  },
  {
    id: 9,
    category: "Structure",
    icon: Mail,
    title: "Import existing bookings",
    description:
      "Upload confirmation PDFs, forward emails to your personal inbox, or paste details. Auto-extraction handles the rest.",
    mockup: "import",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80", // Airplane wing
  },
  {
    id: 10,
    category: "Access",
    icon: Smartphone,
    title: "Access anywhere",
    description:
      "View on web or mobile app (iOS & Android). Everything syncs automatically across all your devices in real-time.",
    mockup: "mobile",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80", // Tropical beach
  },
  {
    id: 11,
    category: "Access",
    icon: FileText,
    title: "Powerful trip tools",
    description:
      "Create a custom trip website to share with companions, generate PDF itineraries for offline use, and more.",
    mockup: "tools",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80", // Mountain sunrise
  },
  {
    id: 12,
    category: "Access",
    icon: Bot,
    title: "Your AI trip assistant",
    description:
      "Included with every trip. Real-time updates, location-aware suggestions, and knows every detail of your itinerary.",
    mockup: "assistant",
    image: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=1920&q=80", // Traveler on cliff
  },
  {
    id: 13,
    category: "Support",
    icon: Headphones,
    title: "24/7 on-call specialists",
    description:
      "Remote support team available around the clock. Speaks local language + yours, helps with emergencies and calls.",
    mockup: "support",
    image: "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=1920&q=80", // Santorini sunset
  },
  {
    id: 14,
    category: "Support",
    icon: UserCheck,
    title: "In-person travel concierge",
    description:
      "A concierge travels with you. Handles logistics, luggage, and navigates like a local. Background verified with reviews.",
    mockup: "concierge",
    image: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=1920&q=80", // Street market
  },
  {
    id: 15,
    category: "Support",
    icon: Users,
    title: "Multiple concierges",
    description:
      "Extra help for kids, dedicated companions, white-glove service. Perfect for families, groups, and luxury trips.",
    mockup: "multiple",
    image: "https://images.unsplash.com/photo-1528164344705-47542687000d?w=1920&q=80", // Safari jeep
  },
  {
    id: 16,
    category: "Support",
    icon: Shield,
    title: "Choose your level of support",
    description:
      "From AI-only to full concierge teams. All human companions are background checked with verified reviews.",
    mockup: "tiers",
    image: "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=1920&q=80", // Northern lights
  },
];

const AUTO_ROTATE_INTERVAL = 6000; // 6 seconds per step

function ChatMockup() {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 overflow-hidden w-full max-w-sm">
      <div className="bg-white/80 px-4 py-3 border-b border-border/30 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <span className="text-xs text-muted-foreground">AI Trip Planner</span>
      </div>
      <div className="p-3 space-y-3 h-52">
        <div className="flex gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%]">
            <p className="text-xs text-foreground">Hi! Where would you like to explore?</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 max-w-[85%]">
            <p className="text-xs">2 weeks in Japan - food, temples, off the beaten path</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%]">
            <p className="text-xs text-foreground">Perfect! Let me suggest a route...</p>
            <div className="flex gap-1 mt-1.5">
              <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.1s]" />
              <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestionsMockup() {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 overflow-hidden w-full max-w-sm">
      <div className="bg-white/80 px-4 py-2.5 border-b border-border/30">
        <span className="text-xs font-medium text-foreground">Curated for You</span>
      </div>
      <div className="p-3 space-y-2">
        {[
          { name: "Tsukiji Outer Market", type: "Food Tour", rating: "4.9" },
          { name: "Fushimi Inari Shrine", type: "Temple", rating: "4.8" },
          { name: "Naoshima Art Island", type: "Hidden Gem", rating: "4.7" },
        ].map((item) => (
          <div key={item.name} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/60 hover:bg-white/80 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
              <p className="text-[10px] text-muted-foreground">{item.type}</p>
            </div>
            <div className="flex items-center gap-0.5 text-[10px] text-amber-600 font-medium">
              <span>{item.rating}</span>
              <svg className="w-2.5 h-2.5 fill-amber-500" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SaveMockup() {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 overflow-hidden w-full max-w-sm">
      <div className="bg-white/80 px-4 py-2.5 border-b border-border/30">
        <span className="text-xs font-medium text-foreground">Add to Trip</span>
      </div>
      <div className="p-3 space-y-2">
        <button className="w-full flex items-center gap-2.5 p-3 rounded-lg bg-amber-50/80 border-2 border-amber-200 text-left">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Suggestion</p>
            <p className="text-[10px] text-muted-foreground">Ideas to explore later</p>
          </div>
        </button>
        <button className="w-full flex items-center gap-2.5 p-3 rounded-lg bg-blue-50/80 border-2 border-blue-200/50 text-left">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Plan</p>
            <p className="text-[10px] text-muted-foreground">No reservation needed</p>
          </div>
        </button>
        <button className="w-full flex items-center gap-2.5 p-3 rounded-lg bg-green-50/80 border-2 border-green-200/50 text-left">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <Bookmark className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Reservation</p>
            <p className="text-[10px] text-muted-foreground">Confirmed booking</p>
          </div>
        </button>
      </div>
    </div>
  );
}

function SegmentsMockup() {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 overflow-hidden w-full max-w-sm">
      <div className="bg-white/80 px-4 py-2.5 border-b border-border/30">
        <span className="text-xs font-medium text-foreground">Trip Segments</span>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          {["Tokyo", "Train", "Kyoto", "Osaka"].map((segment, i) => (
            <div key={segment} className="flex items-center gap-1.5 shrink-0">
              <div className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${
                i === 0 ? "bg-primary text-primary-foreground" : "bg-muted/80 text-muted-foreground"
              }`}>
                {segment}
              </div>
              {i < 3 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1.5">
          {[
            { day: "Day 1-4", place: "Tokyo", items: 12 },
            { day: "Day 5", place: "Shinkansen to Kyoto", items: 1 },
            { day: "Day 6-10", place: "Kyoto", items: 15 },
          ].map((seg) => (
            <div key={seg.day} className="flex items-center justify-between p-2.5 rounded-lg bg-white/60">
              <div>
                <p className="text-xs font-medium text-foreground">{seg.place}</p>
                <p className="text-[10px] text-muted-foreground">{seg.day}</p>
              </div>
              <span className="text-[10px] text-muted-foreground">{seg.items} items</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SupportTiersMockup() {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 overflow-hidden w-full max-w-sm">
      <div className="bg-white/80 px-4 py-2.5 border-b border-border/30">
        <span className="text-xs font-medium text-foreground">Support Tiers</span>
      </div>
      <div className="p-3 space-y-1.5">
        {[
          { name: "AI Assistant", desc: "Included free", icon: Bot, active: true },
          { name: "24/7 On-Call", desc: "Remote team", icon: Headphones, active: false },
          { name: "Travel Concierge", desc: "In-person guide", icon: UserCheck, active: false },
          { name: "Full Team", desc: "Multiple helpers", icon: Users, active: false },
        ].map((tier) => (
          <div key={tier.name} className={`flex items-center gap-2.5 p-2.5 rounded-lg border-2 transition-colors ${
            tier.active ? "border-primary bg-primary/5" : "border-transparent bg-white/60"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              tier.active ? "bg-primary/10" : "bg-muted/50"
            }`}>
              <tier.icon className={`w-4 h-4 ${tier.active ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">{tier.name}</p>
              <p className="text-[10px] text-muted-foreground">{tier.desc}</p>
            </div>
            {tier.active && (
              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DefaultMockup({ step }: { step: typeof steps[0] }) {
  const Icon = step.icon;
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 overflow-hidden w-full max-w-sm">
      <div className="bg-gradient-to-br from-white/80 to-white/60 p-6 flex items-center justify-center min-h-[220px]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center mx-auto mb-3">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground max-w-[180px]">{step.title}</p>
        </div>
      </div>
    </div>
  );
}

function MockupRenderer({ step }: { step: typeof steps[0] }) {
  switch (step.mockup) {
    case "chat":
      return <ChatMockup />;
    case "suggestions":
      return <SuggestionsMockup />;
    case "save":
      return <SaveMockup />;
    case "segments":
      return <SegmentsMockup />;
    case "tiers":
      return <SupportTiersMockup />;
    default:
      return <DefaultMockup step={step} />;
  }
}

export function HeroSection() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const step = steps[currentStep];
  const Icon = step.icon;

  // Auto-rotate through steps
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, AUTO_ROTATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isPaused]);

  const nextStep = () => {
    setIsPaused(true);
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };
  
  const prevStep = () => {
    setIsPaused(true);
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  const goToStep = (index: number) => {
    setIsPaused(true);
    setCurrentStep(index);
  };

  return (
    <section 
      className="relative min-h-[100vh] flex items-center overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background images with crossfade */}
      {steps.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentStep ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={s.image || "/placeholder.svg"}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Dark gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Content */}
          <div className="text-white">
            {/* Category badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-medium mb-6">
              <span>Step {step.id} of {steps.length}</span>
              <span className="w-1 h-1 rounded-full bg-white/40" />
              <span>{step.category}</span>
            </div>

            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-6">
              <Icon className="w-7 h-7 text-white" />
            </div>

            {/* Title */}
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight text-balance">
              {step.title}
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed max-w-lg">
              {step.description}
            </p>

            {/* Navigation */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={prevStep}
                className="rounded-full px-5 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={nextStep} 
                className="rounded-full px-6 bg-white text-foreground hover:bg-white/90"
              >
                {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Progress indicator */}
            <div className="mt-8 flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden max-w-xs">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-white/60 tabular-nums">
                {currentStep + 1}/{steps.length}
              </span>
            </div>
          </div>

          {/* Right side - Mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Subtle glow */}
              <div className="absolute -inset-8 bg-white/5 rounded-3xl blur-3xl" />
              <MockupRenderer step={step} />
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mt-16">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goToStep(i)}
              className={`transition-all duration-300 rounded-full ${
                i === currentStep
                  ? "w-8 h-2 bg-white"
                  : i < currentStep
                  ? "w-2 h-2 bg-white/50"
                  : "w-2 h-2 bg-white/20"
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Pause indicator */}
      {isPaused && (
        <div className="absolute bottom-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 text-xs">
          <div className="w-2 h-2 rounded-sm bg-white/70" />
          <span>Paused</span>
        </div>
      )}
    </section>
  );
}
