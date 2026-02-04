"use client";

import { useState } from "react";
import { Session } from "next-auth";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Layers,
  Layout,
  Sparkles,
  Map,
  MessageSquare,
  User,
  Calendar,
  Settings,
  ChevronDown,
  Search,
  ExternalLink,
} from "lucide-react";

interface ComponentCategory {
  name: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  components: ComponentItem[];
}

interface ComponentItem {
  name: string;
  file: string;
  description: string;
  demoPath?: string;
  dependencies?: string[];
}

export function ComponentsDemoClient({ session }: { session: Session | null }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories: ComponentCategory[] = [
    {
      name: "UI Primitives",
      description: "Base UI components built on Radix UI",
      icon: <Layers className="size-5" />,
      count: 29,
      components: [
        {
          name: "Button",
          file: "components/ui/button.tsx",
          description: "Accessible button with variants (default, outline, ghost, destructive)",
          dependencies: ["@radix-ui/react-slot", "class-variance-authority"],
        },
        {
          name: "Card",
          file: "components/ui/card.tsx",
          description: "Container with header, content, footer sections",
        },
        {
          name: "Dialog",
          file: "components/ui/dialog.tsx",
          description: "Modal dialog with overlay",
          dependencies: ["@radix-ui/react-dialog"],
        },
        {
          name: "Input",
          file: "components/ui/input.tsx",
          description: "Text input field",
        },
        {
          name: "Select",
          file: "components/ui/select.tsx",
          description: "Dropdown select menu",
          dependencies: ["@radix-ui/react-select"],
        },
        {
          name: "Tabs",
          file: "components/ui/tabs.tsx",
          description: "Tabbed interface",
          dependencies: ["@radix-ui/react-tabs"],
        },
        {
          name: "Badge",
          file: "components/ui/badge.tsx",
          description: "Small status indicator",
        },
        {
          name: "Tooltip",
          file: "components/ui/tooltip.tsx",
          description: "Hover tooltip",
          dependencies: ["@radix-ui/react-tooltip"],
        },
        {
          name: "Popover",
          file: "components/ui/popover.tsx",
          description: "Floating content container",
          dependencies: ["@radix-ui/react-popover"],
        },
        {
          name: "Alert Dialog",
          file: "components/ui/alert-dialog.tsx",
          description: "Confirmation dialog",
          dependencies: ["@radix-ui/react-alert-dialog"],
        },
        {
          name: "Dropdown Menu",
          file: "components/ui/dropdown-menu.tsx",
          description: "Context menu",
          dependencies: ["@radix-ui/react-dropdown-menu"],
        },
        {
          name: "Hover Card",
          file: "components/ui/hover-card.tsx",
          description: "Rich hover preview",
          dependencies: ["@radix-ui/react-hover-card"],
        },
        {
          name: "Slider",
          file: "components/ui/slider.tsx",
          description: "Range slider",
          dependencies: ["@radix-ui/react-slider"],
        },
        {
          name: "Switch",
          file: "components/ui/switch.tsx",
          description: "Toggle switch",
          dependencies: ["@radix-ui/react-switch"],
        },
        {
          name: "Collapsible",
          file: "components/ui/collapsible.tsx",
          description: "Expandable content",
          dependencies: ["@radix-ui/react-collapsible"],
        },
        {
          name: "Separator",
          file: "components/ui/separator.tsx",
          description: "Visual divider",
          dependencies: ["@radix-ui/react-separator"],
        },
        {
          name: "Table",
          file: "components/ui/table.tsx",
          description: "Data table",
        },
        {
          name: "Calendar",
          file: "components/ui/calendar.tsx",
          description: "Date picker calendar",
        },
        {
          name: "Location Autocomplete Input",
          file: "components/ui/location-autocomplete-input.tsx",
          description: "Google Places autocomplete",
          dependencies: ["Google Places API"],
        },
        {
          name: "Airport Autocomplete Input",
          file: "components/ui/airport-autocomplete-input.tsx",
          description: "Airport search",
          dependencies: ["Amadeus API"],
        },
        {
          name: "Date Popover",
          file: "components/ui/date-popover.tsx",
          description: "Date picker in popover",
        },
        {
          name: "Click to Edit Field",
          file: "components/ui/click-to-edit-field.tsx",
          description: "Inline editable text",
        },
        {
          name: "Save Indicator",
          file: "components/ui/save-indicator.tsx",
          description: "Auto-save status",
        },
        {
          name: "Segment Type Select",
          file: "components/ui/segment-type-select.tsx",
          description: "Trip segment type picker",
        },
        {
          name: "Hand Drawn Tooltip",
          file: "components/ui/hand-drawn-tooltip.tsx",
          description: "Stylized tooltip",
        },
        {
          name: "Tooltip Overlay",
          file: "components/ui/tooltip-overlay.tsx",
          description: "Full-screen tooltip overlay",
        },
      ],
    },
    {
      name: "Trip Management",
      description: "Components for creating and managing trips",
      icon: <Calendar className="size-5" />,
      count: 15,
      components: [
        {
          name: "Trip Detail",
          file: "components/trip-detail.tsx",
          description: "Main trip view with map and itinerary",
          dependencies: ["Map", "SortableItinerary"],
        },
        {
          name: "Trip Parts Builder",
          file: "components/trip-parts-builder.tsx",
          description: "Build trip structure",
          demoPath: "/trip/new",
        },
        {
          name: "Single Trip View",
          file: "components/single-trip-view.tsx",
          description: "Compact trip display",
        },
        {
          name: "Trip List Card",
          file: "components/trip-list-card.tsx",
          description: "Trip card in list view",
        },
        {
          name: "Trip Selector",
          file: "components/trip-selector.tsx",
          description: "Dropdown to select trip",
          demoPath: "/exp",
        },
        {
          name: "Trip Theme Selector",
          file: "components/trip-theme-selector.tsx",
          description: "Choose trip visual theme",
        },
        {
          name: "Trip Metadata Card",
          file: "components/trip-metadata-card.tsx",
          description: "Trip info summary",
        },
        {
          name: "Trip Info Bar",
          file: "components/trip-info-bar.tsx",
          description: "Quick trip details",
        },
        {
          name: "Trip Plan Preview",
          file: "components/trip-plan-preview.tsx",
          description: "Preview trip structure",
        },
        {
          name: "Trip Structure Map",
          file: "components/trip-structure-map.tsx",
          description: "Visual trip structure",
        },
        {
          name: "Trip Structure Preview",
          file: "components/trip-structure-preview.tsx",
          description: "Preview before creation",
        },
        {
          name: "Trip Structure Welcome",
          file: "components/trip-structure-welcome.tsx",
          description: "Trip builder welcome screen",
        },
        {
          name: "Edit Trip Form",
          file: "components/edit-trip-form.tsx",
          description: "Edit trip metadata with auto-save",
          dependencies: ["useAutoSave"],
        },
        {
          name: "Edit Trip Modal",
          file: "components/edit-trip-modal.tsx",
          description: "Modal for editing trip",
          demoPath: "/exp",
        },
        {
          name: "New Trip Form",
          file: "components/new-trip-form.tsx",
          description: "Create new trip",
        },
      ],
    },
    {
      name: "Segments & Itinerary",
      description: "Components for managing trip segments and itineraries",
      icon: <Layout className="size-5" />,
      count: 10,
      components: [
        {
          name: "Sortable Itinerary",
          file: "components/sortable-itinerary.tsx",
          description: "Drag-and-drop itinerary",
          dependencies: ["@dnd-kit/core", "@dnd-kit/sortable"],
        },
        {
          name: "Segment Edit Modal",
          file: "components/segment-edit-modal.tsx",
          description: "Modal for editing segment",
        },
        {
          name: "Persisted Segment Edit Modal",
          file: "components/persisted-segment-edit-modal.tsx",
          description: "Edit saved segment",
        },
        {
          name: "Edit Segment Form",
          file: "components/edit-segment-form.tsx",
          description: "Segment editor with auto-save",
          dependencies: ["useAutoSave"],
        },
        {
          name: "Horizontal Segment Block",
          file: "components/horizontal-segment-block.tsx",
          description: "Segment in horizontal layout",
        },
        {
          name: "Segment Detail Section",
          file: "components/segment-detail-section.tsx",
          description: "Detailed segment view",
        },
        {
          name: "Segment Divider",
          file: "components/segment-divider.tsx",
          description: "Visual separator between segments",
        },
        {
          name: "Segment Reservation Map",
          file: "components/segment-reservation-map.tsx",
          description: "Map showing segment reservations",
        },
        {
          name: "Trip Segments Detail",
          file: "components/trip-segments-detail.tsx",
          description: "All segments for a trip",
        },
        {
          name: "Trip Day Dashes",
          file: "components/trip-day-dashes.tsx",
          description: "Day indicators",
        },
      ],
    },
    {
      name: "Reservations",
      description: "Components for managing reservations",
      icon: <Settings className="size-5" />,
      count: 4,
      components: [
        {
          name: "Reservation Form",
          file: "components/reservation-form.tsx",
          description: "Create/edit reservation with auto-save",
          dependencies: ["useAutoSave"],
        },
        {
          name: "Reservation Detail Modal",
          file: "components/reservation-detail-modal.tsx",
          description: "View reservation details",
          demoPath: "/exp",
        },
        {
          name: "Add Reservation Modal",
          file: "components/add-reservation-modal.tsx",
          description: "Quick add reservation",
        },
        {
          name: "Reservation Card",
          file: "components/itinerary-view/reservation-card.tsx",
          description: "Reservation display card",
          demoPath: "/view",
        },
      ],
    },
    {
      name: "Maps",
      description: "Map components using Google Maps",
      icon: <Map className="size-5" />,
      count: 3,
      components: [
        {
          name: "Map",
          file: "components/map.tsx",
          description: "Interactive Google Map with markers",
          dependencies: ["@react-google-maps/api"],
        },
        {
          name: "Flight Map",
          file: "components/flight-map.tsx",
          description: "Map showing flight routes",
          dependencies: ["@react-google-maps/api"],
        },
        {
          name: "Trip Reservations Map",
          file: "components/trip-reservations-map.tsx",
          description: "Map of all trip reservations",
          dependencies: ["@react-google-maps/api"],
        },
      ],
    },
    {
      name: "Chat & AI",
      description: "AI-powered chat and messaging components",
      icon: <MessageSquare className="size-5" />,
      count: 9,
      components: [
        {
          name: "Chat Interface",
          file: "components/chat-interface.tsx",
          description: "AI chat with streaming responses",
          dependencies: ["@ai-sdk/react", "ai"],
        },
        {
          name: "Graph Chat Interface",
          file: "components/graph-chat-interface.tsx",
          description: "Chat for profile graph",
          demoPath: "/profile/graph",
          dependencies: ["@ai-sdk/react"],
        },
        {
          name: "Chat Welcome",
          file: "components/chat-welcome.tsx",
          description: "Chat welcome screen",
        },
        {
          name: "Chat Welcome Message",
          file: "components/chat-welcome-message.tsx",
          description: "Personalized welcome",
          demoPath: "/exp",
        },
        {
          name: "Chat Quick Actions",
          file: "components/chat-quick-actions.tsx",
          description: "Quick action buttons",
          demoPath: "/exp",
        },
        {
          name: "Chat Name Dropdown",
          file: "components/chat-name-dropdown.tsx",
          description: "Rename conversation",
          demoPath: "/exp",
        },
        {
          name: "Chat Context Welcome",
          file: "components/chat-context-welcome.tsx",
          description: "Context-aware welcome",
          demoPath: "/exp",
        },
        {
          name: "Conversational Message",
          file: "components/conversational-message.tsx",
          description: "Parsed conversational AI message",
          demoPath: "/exp",
        },
        {
          name: "Madlib Message",
          file: "components/madlib-message.tsx",
          description: "Mad-lib style message",
        },
      ],
    },
    {
      name: "Suggestions",
      description: "Components for displaying and managing suggestions",
      icon: <Sparkles className="size-5" />,
      count: 7,
      components: [
        {
          name: "Suggestion Bubble",
          file: "components/suggestion-bubble.tsx",
          description: "Floating suggestion card",
        },
        {
          name: "Inline Suggestion Bubble",
          file: "components/inline-suggestion-bubble.tsx",
          description: "Inline suggestion display",
        },
        {
          name: "Suggestion Detail Modal",
          file: "components/suggestion-detail-modal.tsx",
          description: "Detailed suggestion view",
          demoPath: "/exp",
        },
        {
          name: "Place Suggestion Card",
          file: "components/place-suggestion-card.tsx",
          description: "Place recommendation card",
        },
        {
          name: "Trip Suggestion Card",
          file: "components/trip-suggestion-card.tsx",
          description: "Trip recommendation card",
          demoPath: "/suggestions",
        },
        {
          name: "Trip Suggestion Detail Modal",
          file: "components/trip-suggestion-detail-modal.tsx",
          description: "Detailed trip suggestion",
          demoPath: "/suggestions",
        },
        {
          name: "Trip Suggestions Carousel",
          file: "components/trip-suggestions-carousel.tsx",
          description: "Scrollable suggestions",
        },
      ],
    },
    {
      name: "Profile & Graph",
      description: "User profile and interactive graph visualization",
      icon: <User className="size-5" />,
      count: 15,
      components: [
        {
          name: "Profile Graph Canvas",
          file: "components/profile-graph-canvas.tsx",
          description: "Interactive React Flow graph",
          demoPath: "/profile/graph",
          dependencies: ["reactflow"],
        },
        {
          name: "Profile Graph Visualization",
          file: "components/profile-graph-visualization.tsx",
          description: "Graph rendering logic",
          demoPath: "/profile/graph",
          dependencies: ["reactflow"],
        },
        {
          name: "Graph Controls",
          file: "components/graph-controls.tsx",
          description: "Zoom, pan, layout controls",
          demoPath: "/profile/graph",
        },
        {
          name: "Color Scheme Selector",
          file: "components/color-scheme-selector.tsx",
          description: "Choose graph colors",
        },
        {
          name: "Profile Client",
          file: "components/profile-client.tsx",
          description: "Main profile page",
          demoPath: "/profile",
        },
        {
          name: "Profile Text View",
          file: "components/profile-text-view.tsx",
          description: "Text-based profile",
          demoPath: "/profile/graph",
        },
        {
          name: "Profile Dossier View",
          file: "components/profile-dossier-view.tsx",
          description: "Detailed profile dossier",
          demoPath: "/profile/graph",
        },
        {
          name: "User Node",
          file: "components/graph-nodes/user-node.tsx",
          description: "User node in graph",
          demoPath: "/profile/graph",
        },
        {
          name: "Category Node",
          file: "components/graph-nodes/category-node.tsx",
          description: "Category node in graph",
          demoPath: "/profile/graph",
        },
        {
          name: "Item Node",
          file: "components/graph-nodes/item-node.tsx",
          description: "Item node in graph",
          demoPath: "/profile/graph",
        },
        {
          name: "Subnode Node",
          file: "components/graph-nodes/subnode-node.tsx",
          description: "Subnode in graph",
          demoPath: "/profile/graph",
        },
        {
          name: "Personal Info Section",
          file: "components/profile/personal-info-section.tsx",
          description: "Edit personal info",
          demoPath: "/profile",
        },
        {
          name: "Contacts Section",
          file: "components/profile/contacts-section.tsx",
          description: "Manage contacts",
          demoPath: "/profile",
        },
        {
          name: "Airport Preferences Section",
          file: "components/profile/airport-preferences-section.tsx",
          description: "Preferred airports",
          demoPath: "/profile",
        },
        {
          name: "Hobbies Section",
          file: "components/profile/hobbies-section.tsx",
          description: "Manage hobbies",
          demoPath: "/profile",
        },
      ],
    },
    {
      name: "Dashboard",
      description: "Dashboard and landing page components",
      icon: <Layout className="size-5" />,
      count: 5,
      components: [
        {
          name: "Dashboard Page",
          file: "components/dashboard/dashboard-page.tsx",
          description: "Main dashboard layout",
          demoPath: "/",
        },
        {
          name: "Dashboard Hero",
          file: "components/dashboard/dashboard-hero.tsx",
          description: "Hero section",
          demoPath: "/",
        },
        {
          name: "Travel Stats Grid",
          file: "components/dashboard/travel-stats-grid.tsx",
          description: "Travel statistics",
          demoPath: "/",
        },
        {
          name: "Upcoming Trips Section",
          file: "components/dashboard/upcoming-trips-section.tsx",
          description: "Upcoming trips list",
          demoPath: "/",
        },
        {
          name: "Quick Links Grid",
          file: "components/dashboard/quick-links-grid.tsx",
          description: "Quick action links",
          demoPath: "/",
        },
      ],
    },
    {
      name: "Itinerary Views",
      description: "Formatted itinerary display components",
      icon: <Calendar className="size-5" />,
      count: 4,
      components: [
        {
          name: "Itinerary Header",
          file: "components/itinerary-view/itinerary-header.tsx",
          description: "Itinerary page header",
          demoPath: "/view",
        },
        {
          name: "Itinerary Stats",
          file: "components/itinerary-view/itinerary-stats.tsx",
          description: "Trip statistics",
          demoPath: "/view",
        },
        {
          name: "Segment Section",
          file: "components/itinerary-view/segment-section.tsx",
          description: "Segment in itinerary view",
          demoPath: "/view",
        },
        {
          name: "Itinerary Empty State",
          file: "components/itinerary-empty-state.tsx",
          description: "Empty itinerary placeholder",
        },
      ],
    },
    {
      name: "Other Components",
      description: "Miscellaneous utility and feature components",
      icon: <Layers className="size-5" />,
      count: 40,
      components: [
        {
          name: "Navbar",
          file: "components/Navbar.tsx",
          description: "Main navigation bar",
        },
        {
          name: "Landing Page",
          file: "components/landing-page.tsx",
          description: "Unauthenticated landing page",
          demoPath: "/",
        },
        {
          name: "Auth Button",
          file: "components/auth-button.tsx",
          description: "Sign in/out button",
        },
        {
          name: "Auth Status Indicator",
          file: "components/auth-status-indicator.tsx",
          description: "Show auth status",
        },
        {
          name: "User Menu",
          file: "components/user-menu.tsx",
          description: "User dropdown menu",
        },
        {
          name: "AI Loading Animation",
          file: "components/ai-loading-animation.tsx",
          description: "AI processing indicator",
        },
        {
          name: "Provider Icon",
          file: "components/provider-icon.tsx",
          description: "OAuth provider icons",
        },
        {
          name: "Travel Stats Card",
          file: "components/travel-stats-card.tsx",
          description: "Travel statistics card",
          demoPath: "/globe",
        },
        {
          name: "Timeline View",
          file: "components/timeline-view.tsx",
          description: "Timeline visualization",
          demoPath: "/exp",
        },
        {
          name: "Table View",
          file: "components/table-view.tsx",
          description: "Table layout",
          demoPath: "/exp",
        },
        {
          name: "Photos View",
          file: "components/photos-view.tsx",
          description: "Photo gallery",
          demoPath: "/exp",
        },
        {
          name: "Message Segments Renderer",
          file: "components/message-segments-renderer.tsx",
          description: "Render AI message segments",
          demoPath: "/exp",
        },
        {
          name: "Amadeus Segments Renderer",
          file: "components/amadeus-segments-renderer.tsx",
          description: "Render Amadeus API segments",
        },
        {
          name: "Flight Hover Card",
          file: "components/flight-hover-card.tsx",
          description: "Flight details on hover",
        },
        {
          name: "Hotel Hover Card",
          file: "components/hotel-hover-card.tsx",
          description: "Hotel details on hover",
        },
        {
          name: "Place Hover Card",
          file: "components/place-hover-card.tsx",
          description: "Place details on hover",
        },
        {
          name: "Quick Trip Modal",
          file: "components/quick-trip-modal.tsx",
          description: "Quick trip creation",
        },
        {
          name: "Clear All Modal",
          file: "components/clear-all-modal.tsx",
          description: "Clear all confirmation",
          demoPath: "/profile/graph",
        },
        {
          name: "Delete Node Modal",
          file: "components/delete-node-modal.tsx",
          description: "Delete node confirmation",
          demoPath: "/profile/graph",
        },
        {
          name: "Edit Chat Modal",
          file: "components/edit-chat-modal.tsx",
          description: "Edit chat settings",
          demoPath: "/exp",
        },
        {
          name: "Add To Trip Modal",
          file: "components/add-to-trip-modal.tsx",
          description: "Add item to trip",
        },
        {
          name: "Activity Side Panel",
          file: "components/activity-side-panel.tsx",
          description: "Activity sidebar",
        },
        {
          name: "Alternative Time Slots",
          file: "components/alternative-time-slots.tsx",
          description: "Show alternative times",
        },
        {
          name: "Conflict Indicator",
          file: "components/conflict-indicator.tsx",
          description: "Show scheduling conflicts",
        },
        {
          name: "Status Icon Indicator",
          file: "components/status-icon-indicator.tsx",
          description: "Status icons",
        },
        {
          name: "Part Card",
          file: "components/part-card.tsx",
          description: "Trip part card",
        },
        {
          name: "Part Tile",
          file: "components/part-tile.tsx",
          description: "Trip part tile",
        },
        {
          name: "New Location",
          file: "components/new-location.tsx",
          description: "Add new location",
        },
        {
          name: "Address Input",
          file: "components/address-input.tsx",
          description: "Address entry field",
        },
        {
          name: "Timezone Select",
          file: "components/timezone-select.tsx",
          description: "Timezone picker",
        },
        {
          name: "Manage Client",
          file: "components/manage-client.tsx",
          description: "Trip management interface",
          demoPath: "/manage",
        },
        {
          name: "Test Menu",
          file: "components/test-menu.tsx",
          description: "Testing utilities menu",
        },
      ],
    },
  ];

  const allComponents = categories.flatMap((cat) => cat.components);

  const filteredCategories = categories
    .map((category) => ({
      ...category,
      components: category.components.filter(
        (comp) =>
          comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comp.file.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(
      (category) =>
        category.components.length > 0 &&
        (selectedCategory === "all" || category.name === selectedCategory)
    );

  const totalComponents = allComponents.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-4xl font-bold mb-2">
                Components Directory
              </h1>
              <p className="text-muted-foreground text-lg">
                {totalComponents} React components organized into {categories.length} categories
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              v2.0
            </Badge>
          </div>

          {/* Search */}
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="all">All ({totalComponents})</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category.name} value={category.name}>
                {category.name} ({category.count})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-8">
            {filteredCategories.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No components found matching &quot;{searchQuery}&quot;
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.name}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {category.icon}
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-bold">
                        {category.name}
                      </h2>
                      <p className="text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {category.components.map((component) => (
                      <Card key={component.file} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {component.name}
                          </CardTitle>
                          <CardDescription className="text-xs font-mono text-muted-foreground/70">
                            {component.file}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            {component.description}
                          </p>

                          {component.dependencies && component.dependencies.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {component.dependencies.map((dep) => (
                                <Badge key={dep} variant="secondary" className="text-xs">
                                  {dep}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {component.demoPath && (
                            <Link
                              href={component.demoPath}
                              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="size-3" />
                              View Demo
                            </Link>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Separator className="mt-8" />
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Component Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Components</p>
                <p className="text-3xl font-bold">{totalComponents}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">UI Primitives</p>
                <p className="text-3xl font-bold">29</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Feature Components</p>
                <p className="text-3xl font-bold">{totalComponents - 29}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-3xl font-bold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technology Stack */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Technology Stack</CardTitle>
            <CardDescription>
              Key libraries and frameworks used across components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-semibold mb-3">Core Technologies</h3>
                <div className="space-y-2">
                  <Badge>React 19</Badge>
                  <Badge>Next.js 15.3.3</Badge>
                  <Badge>TypeScript</Badge>
                  <Badge>Tailwind CSS 4</Badge>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">UI Libraries</h3>
                <div className="space-y-2">
                  <Badge variant="secondary">Radix UI</Badge>
                  <Badge variant="secondary">Lucide React</Badge>
                  <Badge variant="secondary">Class Variance Authority</Badge>
                  <Badge variant="secondary">Framer Motion</Badge>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Specialized Libraries</h3>
                <div className="space-y-2">
                  <Badge variant="outline">React Flow</Badge>
                  <Badge variant="outline">@dnd-kit</Badge>
                  <Badge variant="outline">@react-google-maps/api</Badge>
                  <Badge variant="outline">@ai-sdk/react</Badge>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">External APIs</h3>
                <div className="space-y-2">
                  <Badge variant="outline">Google Places API</Badge>
                  <Badge variant="outline">Amadeus API</Badge>
                  <Badge variant="outline">OpenAI</Badge>
                  <Badge variant="outline">UploadThing</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Pages */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Explore Components in Action</CardTitle>
            <CardDescription>
              Visit these pages to see components in their natural context
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <Link href="/exp">
                <Button variant="outline" className="w-full justify-start">
                  <Sparkles className="mr-2 size-4" />
                  /exp - Most Components
                </Button>
              </Link>
              <Link href="/profile#dossier">
                <Button variant="outline" className="w-full justify-start">
                  <User className="mr-2 size-4" />
                  /profile#dossier - Profile Builder
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full justify-start">
                  <Layout className="mr-2 size-4" />
                  / - Dashboard
                </Button>
              </Link>
              <Link href="/suggestions">
                <Button variant="outline" className="w-full justify-start">
                  <Sparkles className="mr-2 size-4" />
                  /suggestions - Trip Suggestions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
