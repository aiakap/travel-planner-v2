import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, TestTube, Settings, ArrowRight, Plug, Upload, Trash2, Mail, List, ImageIcon } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Manage and monitor your prompt plugin system
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
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
              Active Plugins
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">
              All plugins currently enabled
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

      {/* Admin Tools */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Admin Tools</h3>
      </div>
      
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
            <CardTitle>Test Prompts</CardTitle>
            <CardDescription>
              Build and preview prompts with different contexts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/prompts/test">
              <Button variant="outline" className="w-full">
                Open Testing Interface
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Testing</CardTitle>
            <CardDescription>
              Test and monitor external API integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/apis">
              <Button variant="outline" className="w-full">
                Test APIs
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
      </div>

      {/* Individual API Test Pages */}
      <div>
        <h3 className="text-xl font-semibold mb-4 mt-8">Individual API Tests</h3>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Google Maps</CardTitle>
            <CardDescription>
              Places, Geocoding, Timezone APIs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/apis/google-maps">
              <Button variant="outline" className="w-full" size="sm">
                Test Google Maps
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amadeus</CardTitle>
            <CardDescription>
              Flight search and hotel APIs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/apis/amadeus">
              <Button variant="outline" className="w-full" size="sm">
                Test Amadeus
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>OpenAI</CardTitle>
            <CardDescription>
              Chat and structured generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/apis/openai">
              <Button variant="outline" className="w-full" size="sm">
                Test OpenAI
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vertex AI Imagen</CardTitle>
            <CardDescription>
              Image generation with Imagen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/apis/imagen">
              <Button variant="outline" className="w-full" size="sm">
                Test Imagen
                <ImageIcon className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Plugin System Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Registry Location</span>
            <span className="font-mono text-xs">app/exp/lib/prompts/registry.ts</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Persistence</span>
            <span className="text-orange-600 font-medium">Preview Only (No persistence yet)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
