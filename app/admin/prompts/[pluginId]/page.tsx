"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Save, AlertCircle, Info } from "lucide-react";
import Link from "next/link";

interface PluginData {
  id: string;
  name: string;
  content: string;
  priority: number;
  shouldIncludeCode: string;
  enabled: boolean;
  isBuiltIn: boolean;
  description: string;
}

export default function PluginEditorPage({ params }: { params: { pluginId: string } }) {
  const router = useRouter();
  const [plugin, setPlugin] = useState<PluginData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPlugin();
  }, [params.pluginId]);

  const fetchPlugin = async () => {
    try {
      const response = await fetch(`/api/admin/prompts/${params.pluginId}`);
      if (response.ok) {
        const data = await response.json();
        setPlugin(data);
      } else {
        console.error("Failed to fetch plugin");
      }
    } catch (error) {
      console.error("Error fetching plugin:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!plugin) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/prompts/${params.pluginId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: plugin.name,
          content: plugin.content,
          priority: plugin.priority,
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Error saving plugin:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!plugin) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Plugin not found</AlertDescription>
        </Alert>
        <Link href="/admin/prompts">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plugins
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/admin/prompts">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{plugin.name}</h2>
              <p className="text-sm text-muted-foreground font-mono">{plugin.id}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Warning */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Preview Only:</strong> Changes are not persisted to the file system. 
          This interface is for viewing and testing plugin configurations.
        </AlertDescription>
      </Alert>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Plugin Metadata</CardTitle>
          <CardDescription>{plugin.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Plugin Name</Label>
              <Input
                id="name"
                value={plugin.name}
                onChange={(e) => setPlugin({ ...plugin, name: e.target.value })}
                disabled={plugin.isBuiltIn}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="id">Plugin ID</Label>
              <Input
                id="id"
                value={plugin.id}
                disabled
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={plugin.priority}
                onChange={(e) => setPlugin({ ...plugin, priority: parseInt(e.target.value) || 0 })}
                disabled={plugin.isBuiltIn}
              />
              <p className="text-xs text-muted-foreground">
                Lower values execute first (0 = base, 10-29 = creation, 30-49 = context, 50-69 = enhancement, 70+ = experimental)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-2 h-9">
                <Badge variant={plugin.enabled ? "default" : "secondary"}>
                  {plugin.enabled ? "Active" : "Inactive"}
                </Badge>
                {plugin.isBuiltIn && (
                  <Badge variant="outline">Built-in</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Prompt Content</CardTitle>
          <CardDescription>
            The actual prompt text that will be included when this plugin is active
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Content</Label>
              <span className="text-sm text-muted-foreground">
                {plugin.content.length.toLocaleString()} characters
              </span>
            </div>
            <Textarea
              id="content"
              value={plugin.content}
              onChange={(e) => setPlugin({ ...plugin, content: e.target.value })}
              disabled={plugin.isBuiltIn}
              className="font-mono text-sm min-h-[400px]"
              placeholder="Enter prompt content..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Activation Logic */}
      <Card>
        <CardHeader>
          <CardTitle>Activation Logic</CardTitle>
          <CardDescription>
            Function that determines when this plugin should be included
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shouldInclude">shouldInclude Function</Label>
            <Textarea
              id="shouldInclude"
              value={plugin.shouldIncludeCode}
              disabled
              className="font-mono text-sm min-h-[200px] bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              This function receives a <code className="px-1 py-0.5 bg-muted rounded">PromptBuildContext</code> object 
              with properties: userMessage, messageCount, hasExistingTrip, chatType, metadata
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-2xl font-bold">{plugin.content.length}</div>
              <p className="text-xs text-muted-foreground">Total characters</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{Math.ceil(plugin.content.length / 4)}</div>
              <p className="text-xs text-muted-foreground">Estimated tokens</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{plugin.priority}</div>
              <p className="text-xs text-muted-foreground">Priority order</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
