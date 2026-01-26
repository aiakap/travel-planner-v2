import { NextResponse } from "next/server";
import { createPromptRegistry } from "@/app/exp/lib/prompts/registry";
import { BASE_EXP_PROMPT } from "@/app/exp/lib/prompts/base-exp-prompt";

export async function GET() {
  try {
    const registry = createPromptRegistry();
    
    // Get all plugins from registry
    const plugins = Array.from(registry.entries()).map(([id, plugin]) => ({
      id: plugin.id,
      name: plugin.name,
      priority: plugin.priority ?? 999,
      contentLength: plugin.content.length,
      contentPreview: plugin.content.substring(0, 200) + (plugin.content.length > 200 ? "..." : ""),
      hasCustomLogic: !!plugin.shouldInclude,
      enabled: true, // All plugins enabled by default for now
    }));

    // Add base prompt manually since it's not in registry
    const basePlugin = {
      id: "base",
      name: "Base Prompt",
      priority: 0,
      contentLength: BASE_EXP_PROMPT.length,
      contentPreview: BASE_EXP_PROMPT.substring(0, 200) + "...",
      hasCustomLogic: false,
      enabled: true,
    };

    // Sort by priority
    const allPlugins = [basePlugin, ...plugins].sort((a, b) => a.priority - b.priority);

    return NextResponse.json({ 
      plugins: allPlugins,
      total: allPlugins.length
    });
  } catch (error) {
    console.error("[Admin API] Error fetching plugins:", error);
    return NextResponse.json(
      { error: "Failed to fetch plugins" },
      { status: 500 }
    );
  }
}
