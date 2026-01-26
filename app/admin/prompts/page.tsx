"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Eye, TestTube } from "lucide-react";

interface Plugin {
  id: string;
  name: string;
  priority: number;
  contentLength: number;
  contentPreview: string;
  hasCustomLogic: boolean;
  enabled: boolean;
}

function getPriorityColor(priority: number): string {
  if (priority <= 9) return "bg-blue-500";
  if (priority <= 29) return "bg-purple-500";
  if (priority <= 49) return "bg-orange-500";
  if (priority <= 69) return "bg-teal-500";
  return "bg-pink-500";
}

function getPriorityLabel(priority: number): string {
  if (priority <= 9) return "Core";
  if (priority <= 29) return "Creation";
  if (priority <= 49) return "Context";
  if (priority <= 69) return "Enhancement";
  return "Experimental";
}

export default function PluginsListPage() {
  const router = useRouter();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEnabled, setFilterEnabled] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    try {
      const response = await fetch("/api/admin/prompts");
      const data = await response.json();
      setPlugins(data.plugins);
    } catch (error) {
      console.error("Failed to fetch plugins:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlugins = plugins.filter((plugin) => {
    const matchesSearch =
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterEnabled === "all" ||
      (filterEnabled === "active" && plugin.enabled) ||
      (filterEnabled === "inactive" && !plugin.enabled);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Prompt Plugins</h2>
          <p className="text-muted-foreground">
            Manage and configure your prompt plugin system
          </p>
        </div>
        <Link href="/admin/prompts/test">
          <Button>
            <TestTube className="mr-2 h-4 w-4" />
            Test Prompts
          </Button>
        </Link>
      </div>

      {/* Priority Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Guidelines</CardTitle>
          <CardDescription>
            Plugins are executed in priority order (lower = earlier in prompt)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-blue-500">0-9: Core</Badge>
            <Badge className="bg-purple-500">10-29: Entity Creation</Badge>
            <Badge className="bg-orange-500">30-49: Context Handling</Badge>
            <Badge className="bg-teal-500">50-69: Enhancement</Badge>
            <Badge className="bg-pink-500">70+: Experimental</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterEnabled === "all" ? "default" : "outline"}
            onClick={() => setFilterEnabled("all")}
          >
            All
          </Button>
          <Button
            variant={filterEnabled === "active" ? "default" : "outline"}
            onClick={() => setFilterEnabled("active")}
          >
            Active
          </Button>
          <Button
            variant={filterEnabled === "inactive" ? "default" : "outline"}
            onClick={() => setFilterEnabled("inactive")}
          >
            Inactive
          </Button>
        </div>
      </div>

      {/* Plugins Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlugins.map((plugin) => (
          <Card key={plugin.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{plugin.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    {plugin.id}
                  </CardDescription>
                </div>
                <Switch checked={plugin.enabled} disabled />
              </div>
              <div className="flex gap-2 pt-2">
                <Badge className={getPriorityColor(plugin.priority)}>
                  Priority: {plugin.priority}
                </Badge>
                <Badge variant="outline">
                  {getPriorityLabel(plugin.priority)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {plugin.contentPreview}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{plugin.contentLength.toLocaleString()} characters</span>
                  {plugin.hasCustomLogic && (
                    <Badge variant="secondary" className="text-xs">
                      Custom Logic
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/admin/prompts/${plugin.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredPlugins.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No plugins found matching your criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {filteredPlugins.length} of {plugins.length} plugins
            </span>
            <span className="text-muted-foreground">
              {plugins.filter(p => p.enabled).length} active
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
