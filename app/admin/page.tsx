import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  TestTube, 
  ArrowRight, 
  Plug, 
  Upload, 
  Trash2, 
  Mail, 
  List, 
  ImageIcon, 
  Code, 
  MapPin,
  Database,
  Dice5,
  Clock,
  Brain,
  Map,
  Plane,
  Bot,
} from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Manage prompts, test APIs, and access admin tools
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Plugins
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">
              1 base + 5 conditional plugins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Card Types
            </CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10</div>
            <p className="text-xs text-muted-foreground">
              Defined in exp-response-schema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Suggestion Types
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Places, Transport, Hotels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Token Savings
            </CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">60-80%</div>
            <p className="text-xs text-muted-foreground">
              Average reduction vs monolithic prompt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Core Tools */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Core Tools</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Manage Plugins</CardTitle>
              <CardDescription>
                View, edit, and configure all prompt plugins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/prompts">
                <Button className="w-full">
                  View Plugins
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Prompts & Cards</CardTitle>
              <CardDescription>
                Build prompts and preview AI-generated cards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/prompts/test">
                <Button variant="outline" className="w-full">
                  Open Testing Interface
                  <TestTube className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Testing</CardTitle>
              <CardDescription>
                Test external APIs and view health status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/apis">
                <Button variant="outline" className="w-full">
                  API Overview
                  <Plug className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Extraction</CardTitle>
              <CardDescription>
                Extract flight/hotel data from confirmation emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/email-extract">
                <Button variant="outline" className="w-full">
                  Email Extraction
                  <Mail className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Travel Extraction (Queue)</CardTitle>
              <CardDescription>
                Batch upload and process .eml files with queue system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/travel-extraction">
                <Button variant="outline" className="w-full">
                  Queue Processing
                  <List className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Management */}
      <div>
        <h3 className="text-xl font-semibold mb-4">User Management</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>User Data Cleanup</CardTitle>
              <CardDescription>
                Search users and manage their data (profile, graph, trips)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/user-cleanup">
                <Button variant="outline" className="w-full">
                  Manage User Data
                  <Trash2 className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seed Trips</CardTitle>
              <CardDescription>
                Generate comprehensive test trips with real venue data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/seed-trips">
                <Button variant="outline" className="w-full">
                  Generate Test Trips
                  <Database className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Testing & Debug */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Testing & Debug</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Card Explorer</CardTitle>
              <CardDescription>
                Explore all 10 card types with schema reference
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/cards">
                <Button variant="outline" className="w-full">
                  Card Explorer
                  <Code className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Suggestion Testing</CardTitle>
              <CardDescription>
                Test place, transport, and hotel suggestion schemas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/suggestions">
                <Button variant="outline" className="w-full">
                  Test Suggestions
                  <MapPin className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Get Lucky Test</CardTitle>
              <CardDescription>
                Debug harness for surprise trip feature
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/get-lucky-test">
                <Button variant="outline" className="w-full">
                  Test Get Lucky
                  <Dice5 className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timezone Test</CardTitle>
              <CardDescription>
                Test date and timezone conversion utilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/timezone-test">
                <Button variant="outline" className="w-full">
                  Test Timezones
                  <Clock className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trip Intelligence</CardTitle>
              <CardDescription>
                Test currency, emergency, cultural, and activity features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/trip-intelligence">
                <Button variant="outline" className="w-full">
                  Test Intelligence
                  <Brain className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick API Tests */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Quick API Tests</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Google Maps</CardTitle>
              <CardDescription className="text-xs">
                Places, Geocoding, Timezone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/apis/google-maps">
                <Button variant="outline" className="w-full" size="sm">
                  Test
                  <Map className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Amadeus</CardTitle>
              <CardDescription className="text-xs">
                Flights, Hotels, Transfers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/apis/amadeus">
                <Button variant="outline" className="w-full" size="sm">
                  Test
                  <Plane className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">OpenAI</CardTitle>
              <CardDescription className="text-xs">
                Chat, Structured Outputs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/apis/openai">
                <Button variant="outline" className="w-full" size="sm">
                  Test
                  <Bot className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Imagen</CardTitle>
              <CardDescription className="text-xs">
                AI Image Generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/apis/imagen">
                <Button variant="outline" className="w-full" size="sm">
                  Test
                  <ImageIcon className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Admin Version</span>
            <span className="font-medium">2.1.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Exp System</span>
            <span className="font-medium">Structured Outputs (Zod + OpenAI)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Schema Location</span>
            <span className="font-mono text-xs">lib/schemas/exp-response-schema.ts</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Plugin Registry</span>
            <span className="font-mono text-xs">app/exp/lib/prompts/registry.ts</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
