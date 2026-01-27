import { NextResponse } from "next/server";
import { createPromptRegistry } from "@/app/exp/lib/prompts/registry";
import { BASE_EXP_PROMPT } from "@/app/exp/lib/prompts/base-exp-prompt";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pluginId: string }> }
) {
  try {
    const { pluginId } = await params;

    // Handle base prompt specially
    if (pluginId === "base") {
      return NextResponse.json({
        id: "base",
        name: "Base Prompt",
        content: BASE_EXP_PROMPT,
        priority: 0,
        shouldIncludeCode: "() => true // Always included",
        enabled: true,
        isBuiltIn: true,
        description: "Core role definition and output format. Always included in every prompt.",
      });
    }

    const registry = createPromptRegistry();
    const plugin = registry.get(pluginId);

    if (!plugin) {
      return NextResponse.json(
        { error: "Plugin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: plugin.id,
      name: plugin.name,
      content: plugin.content,
      priority: plugin.priority ?? 999,
      shouldIncludeCode: plugin.shouldInclude.toString(),
      enabled: true,
      isBuiltIn: true,
      description: `Conditional plugin with priority ${plugin.priority ?? 999}`,
    });
  } catch (error) {
    console.error("[Admin API] Error fetching plugin:", error);
    return NextResponse.json(
      { error: "Failed to fetch plugin details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ pluginId: string }> }
) {
  try {
    const body = await request.json();
    const { pluginId } = await params;

    // Validate
    if (!body.name || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields: name and content" },
        { status: 400 }
      );
    }

    // TODO: Persist to file system or database
    // For now, just acknowledge the update
    console.log(`[Admin API] Would update plugin ${pluginId}:`, {
      name: body.name,
      priority: body.priority,
      contentLength: body.content.length,
    });

    return NextResponse.json({
      success: true,
      message: "Plugin update acknowledged (not persisted - preview only)",
      pluginId: pluginId,
    });
  } catch (error) {
    console.error("[Admin API] Error updating plugin:", error);
    return NextResponse.json(
      { error: "Failed to update plugin" },
      { status: 500 }
    );
  }
}
