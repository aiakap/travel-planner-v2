"use client";

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  User,
  Map,
  Sparkles,
  Code,
  ArrowRight,
  CheckCircle2,
  FileCode,
  Layers,
  Zap,
  BookOpen,
} from "lucide-react";

interface ObjectIndexClientProps {
  firstTripId?: string;
}

interface ObjectType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  components: {
    view: string;
    cards: string[];
  };
  demoUrl: string | null;
  requiresParam?: string;
}

export function ObjectIndexClient({ firstTripId }: ObjectIndexClientProps) {
  const objectTypes: ObjectType[] = [
    {
      id: "journey_architect",
      name: "Journey Architect",
      description: "Build travel timeline structures with AI - organize Journeys and Chapters",
      icon: <Map className="size-6" />,
      features: [
        "Intelligent Drafter - infers missing pieces",
        "Strict terminology: Journey/Chapter/Moment",
        "Automatic travel time estimation",
        "Aspirational naming for trips",
      ],
      components: {
        view: "TripBuilderView",
        cards: ["InfoRequestCard"],
      },
      demoUrl: "/object/journey_architect",
    },
    {
      id: "new_chat",
      name: "Trip Chat",
      description: "Manage trips with AI assistance for hotels, restaurants, and activities",
      icon: <MessageSquare className="size-6" />,
      features: [
        "AI suggests hotels, restaurants, activities",
        "View trip with segments and reservations",
        "Interactive booking cards in chat",
        "Real-time trip updates",
      ],
      components: {
        view: "TripView",
        cards: ["HotelCard"],
      },
      demoUrl: firstTripId ? `/object/new_chat?tripId=${firstTripId}` : null,
      requiresParam: "tripId",
    },
    {
      id: "profile_attribute",
      name: "Profile Builder",
      description: "Build travel profiles through conversational AI",
      icon: <User className="size-6" />,
      features: [
        "AI identifies hobbies and preferences",
        "Real-time profile updates",
        "Accept/reject suggestions",
        "Build comprehensive travel profile",
      ],
      components: {
        view: "ProfileView",
        cards: ["ProfileSuggestionCard"],
      },
      demoUrl: "/object/profile_attribute",
    },
    {
      id: "trip_explorer",
      name: "Trip Creator",
      description: "Create trip structures before committing to database",
      icon: <Sparkles className="size-6" />,
      features: [
        "AI helps plan trip structure",
        "Preview before saving",
        "Define destinations and segments",
        "Apply structure to create trip",
      ],
      components: {
        view: "TripPreviewView",
        cards: ["TripStructureCard"],
      },
      demoUrl: "/object/trip_explorer",
    },
  ];

  const keyBenefits = [
    {
      icon: <Layers className="size-5" />,
      title: "Configuration-Driven",
      description: "Add new object types with a single config file",
    },
    {
      icon: <Zap className="size-5" />,
      title: "Split Panel UI",
      description: "Chat + data view with resizable panels",
    },
    {
      icon: <Code className="size-5" />,
      title: "Generic API",
      description: "Single endpoint handles all object types",
    },
    {
      icon: <Sparkles className="size-5" />,
      title: "Minimal Dependencies",
      description: "Isolated from legacy systems",
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4">
              Configuration-Driven Architecture
            </Badge>
            <h1 className="font-display text-5xl font-bold mb-4">
              Object-Based Chat System
            </h1>
            <p className="text-muted-foreground text-xl mb-6">
              A generic, scalable chat system where each object type is
              self-contained with its own configuration, prompts, and view
              components.
            </p>
            <div className="flex gap-3">
              <Link href="#object-types">
                <Button size="lg">
                  Explore Object Types
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <Link href="#architecture">
                <Button size="lg" variant="outline">
                  <BookOpen className="mr-2 size-4" />
                  Learn Architecture
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {keyBenefits.map((benefit) => (
            <Card key={benefit.title}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Object Types Section */}
      <div id="object-types" className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="font-display text-3xl font-bold mb-2">
            Available Object Types
          </h2>
          <p className="text-muted-foreground text-lg">
            Pre-configured conversational interfaces ready to use
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {objectTypes.map((type) => (
            <Card key={type.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    {type.icon}
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {type.id}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{type.name}</CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Features</h4>
                  <ul className="space-y-1">
                    {type.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Components</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {type.components.view}
                    </Badge>
                    {type.components.cards.map((card) => (
                      <Badge key={card} variant="outline" className="text-xs">
                        {card}
                      </Badge>
                    ))}
                  </div>
                </div>

                {type.demoUrl ? (
                  <Link href={type.demoUrl}>
                    <Button className="w-full">
                      Try {type.name}
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Button className="w-full" disabled>
                      Requires Trip
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      <Link
                        href="/trip/new"
                        className="text-primary hover:underline"
                      >
                        Create a trip first
                      </Link>{" "}
                      to try this demo
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Architecture & Guide Section */}
      <div id="architecture" className="container mx-auto px-4 py-12">
        <Tabs defaultValue="architecture" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3">
            <TabsTrigger value="architecture">Architecture</TabsTrigger>
            <TabsTrigger value="structure">File Structure</TabsTrigger>
            <TabsTrigger value="guide">Quick Guide</TabsTrigger>
          </TabsList>

          {/* Architecture Tab */}
          <TabsContent value="architecture" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>
                  Understanding the object-based chat system architecture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Data Flow</h3>
                  <div className="bg-muted/50 p-6 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
{`User navigates to /object/[object-type]
         ↓
Server component (page.tsx)
  - Checks authentication
  - Loads configuration
  - Fetches initial data
         ↓
Client component (client.tsx)
  - Renders ChatLayout
  - Displays chat + data panels
         ↓
User sends message
         ↓
POST /api/object/chat
  - Loads config by objectType
  - Calls AI (Claude 3.5 Sonnet)
  - Parses response for cards
         ↓
Returns text + cards
         ↓
Chat panel displays message + cards
Data panel shows updated view`}
                    </pre>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Key Components</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <FileCode className="size-4" />
                        Configuration System
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Each object type defined by a single config file with AI
                        prompts, data fetching, and component mappings.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Layers className="size-4" />
                        Split Panel UI
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Resizable panels with chat (40%) and data view (60%).
                        Keyboard shortcuts and localStorage persistence.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Zap className="size-4" />
                        Generic API
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Single endpoint handles all object types. Loads config,
                        calls AI, parses cards from response.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="size-4" />
                        AI Integration
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Uses Anthropic Claude with config-based prompts. Cards
                        extracted via regex patterns.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Design Principles</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                      <span>
                        <strong>Configuration-Driven:</strong> Add object types
                        without touching core code
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                      <span>
                        <strong>Minimal Dependencies:</strong> Isolated from
                        legacy systems (/app/exp, /app/chat)
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                      <span>
                        <strong>Type-Safe:</strong> TypeScript throughout with
                        strict typing
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                      <span>
                        <strong>Reusable:</strong> Core components work for any
                        object type
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* File Structure Tab */}
          <TabsContent value="structure" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Directory Structure</CardTitle>
                <CardDescription>
                  How the object system is organized
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-6 rounded-lg">
                  <pre className="text-sm overflow-x-auto font-mono">
{`app/object/
├── [object-type]/              # Dynamic route
│   ├── page.tsx               # Server component
│   └── client.tsx             # Client wrapper
├── _core/                     # Shared components
│   ├── chat-layout.tsx        # Split panel layout
│   ├── chat-panel.tsx         # Chat interface
│   ├── data-panel.tsx         # Data view
│   ├── resizable-divider.tsx  # Draggable divider
│   └── types.ts               # Core types
├── _configs/                   # Configuration system
│   ├── types.ts                # Config types
│   ├── loader.ts               # Config loader
│   ├── registry.ts             # Config registry
│   ├── journey_architect.config.ts  # Journey Architect
│   ├── new_chat.config.ts      # Trip chat
│   ├── profile_attribute.config.ts  # Profile
│   └── trip_explorer.config.ts # Trip creator
├── _views/                     # Right panel views
│   ├── trip-builder-view.tsx   # Journey timeline
│   ├── trip-view.tsx
│   ├── profile-view.tsx
│   └── trip-preview-view.tsx
└── _cards/                     # Left panel cards
    ├── info-request-card.tsx   # Missing info/redirects
    ├── hotel-card.tsx
    ├── profile-suggestion-card.tsx
    └── trip-structure-card.tsx

lib/object/
├── ai-client.ts                # AI integration
├── response-parser.ts          # Card extraction
└── data-fetchers/
    ├── journey.ts              # Journey/trip data
    └── trip.ts                 # Data fetching

app/api/object/chat/
└── route.ts                    # Generic API endpoint`}
                  </pre>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Core Directories</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>
                        <code className="bg-muted px-1.5 py-0.5 rounded">
                          _core/
                        </code>{" "}
                        - Shared components that work for any object type
                      </li>
                      <li>
                        <code className="bg-muted px-1.5 py-0.5 rounded">
                          _configs/
                        </code>{" "}
                        - Configuration files defining each object type
                      </li>
                      <li>
                        <code className="bg-muted px-1.5 py-0.5 rounded">
                          _views/
                        </code>{" "}
                        - Right panel view components
                      </li>
                      <li>
                        <code className="bg-muted px-1.5 py-0.5 rounded">
                          _cards/
                        </code>{" "}
                        - Left panel card components
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Guide Tab */}
          <TabsContent value="guide" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add a New Object Type</CardTitle>
                <CardDescription>
                  Step-by-step guide to creating a new object type in under 30
                  minutes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    {
                      step: 1,
                      title: "Create View Component",
                      code: `// app/object/_views/my-view.tsx
export function MyView({ data }: { data: any }) {
  return <div>{/* Your view */}</div>;
}`,
                    },
                    {
                      step: 2,
                      title: "Create Card Component",
                      code: `// app/object/_cards/my-card.tsx
import { CardProps } from "../_core/types";

export function MyCard({ data, onDataUpdate }: CardProps) {
  return <div>{/* Your card */}</div>;
}`,
                    },
                    {
                      step: 3,
                      title: "Create Data Fetcher (Optional)",
                      code: `// lib/object/data-fetchers/my-data.ts
export async function fetchMyData(userId: string) {
  // Fetch from database
  return { myData: ... };
}`,
                    },
                    {
                      step: 4,
                      title: "Create Configuration",
                      code: `// app/object/_configs/my_object.config.ts
export const myObjectConfig: ObjectConfig = {
  id: "my_object",
  name: "My Object",
  systemPrompt: \`...[MY_CARD: {...}]...\`,
  dataSource: { fetch: fetchMyData },
  leftPanel: { cardRenderers: { my_card: MyCard } },
  rightPanel: { component: MyView },
};`,
                    },
                    {
                      step: 5,
                      title: "Register Configuration",
                      code: `// app/object/_configs/registry.ts
import { myObjectConfig } from "./my_object.config";
registerConfig(myObjectConfig);`,
                    },
                    {
                      step: 6,
                      title: "Update Response Parser",
                      code: `// lib/object/response-parser.ts
const myCardRegex = /\\[MY_CARD:\\s*(\\{[\\s\\S]*?\\})\\]/g;
// Extract cards from AI response`,
                    },
                    {
                      step: 7,
                      title: "Navigate to Your Object Type",
                      code: `// Visit in browser
/object/my_object`,
                    },
                  ].map((item) => (
                    <div key={item.step} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                          {item.step}
                        </div>
                        <h4 className="font-semibold">{item.title}</h4>
                      </div>
                      <div className="ml-11">
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <pre className="text-xs overflow-x-auto">
                            {item.code}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm font-semibold mb-2">
                      That&apos;s it! No changes needed to:
                    </p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Core components</li>
                      <li>• API routes</li>
                      <li>• Layout components</li>
                      <li>• Other object types</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Documentation Links */}
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>
              Learn more about the object-based chat system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Link href="/object/README.md" target="_blank">
                <div className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <BookOpen className="size-5 text-primary" />
                    <div>
                      <h4 className="font-semibold">README</h4>
                      <p className="text-sm text-muted-foreground">
                        Complete system documentation
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/object/QUICK_START.md" target="_blank">
                <div className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Zap className="size-5 text-primary" />
                    <div>
                      <h4 className="font-semibold">Quick Start</h4>
                      <p className="text-sm text-muted-foreground">
                        Get started in 5 minutes
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
