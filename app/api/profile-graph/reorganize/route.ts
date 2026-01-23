/**
 * Profile Graph Reorganization API Route
 * 
 * Handles automatic reorganization of categories when they exceed item limits
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserProfileGraph } from "@/lib/actions/profile-graph-actions";
import { organizeIntoSubcategories } from "@/lib/ai/subcategory-organizer";
import { ProfileGraphItem } from "@/lib/types/profile-graph";
import { prisma } from "@/lib/prisma";
import { addItemToXml, parseXmlToGraph, removeItemFromXml } from "@/lib/profile-graph-xml";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { category } = body;

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    console.log("🔄 [Reorganize API] Reorganizing category:", category);

    // Get current profile graph
    const profileGraph = await getUserProfileGraph(session.user.id);
    
    // Find items in the category
    const itemsInCategory = profileGraph.graphData.nodes.filter(
      n => n.type === 'item' && n.category === category
    );

    if (itemsInCategory.length < 6) {
      return NextResponse.json(
        { error: "Category does not need reorganization (less than 6 items)" },
        { status: 400 }
      );
    }

    console.log(`📊 [Reorganize API] Found ${itemsInCategory.length} items to reorganize`);

    // Use AI to organize into subcategories
    // Convert GraphNode[] to ProfileGraphItem[]
    const itemsToOrganize: ProfileGraphItem[] = itemsInCategory
      .filter(node => node.category && node.value)
      .map(node => ({
        id: node.id,
        category: node.category!,
        value: node.value!,
        metadata: node.metadata || {}
      }));
    const organization = await organizeIntoSubcategories(category, itemsToOrganize);

    console.log(`✅ [Reorganize API] AI created ${organization.subcategories.length} subcategories`);
    console.log(`📊 [Reorganize API] Confidence: ${organization.confidence}`);

    // Get current XML
    let currentXml = profileGraph.xmlData;

    // Remove all items from the category
    for (const item of itemsInCategory) {
      if (item.category && item.value) {
        currentXml = removeItemFromXml(
          currentXml,
          item.category,
          item.metadata?.subcategory || "general",
          item.value
        );
      }
    }

    // Add items back with new subcategories
    for (const subcat of organization.subcategories) {
      for (const item of subcat.items) {
        currentXml = addItemToXml(
          currentXml,
          item.category!,
          subcat.name,
          item.value,
          {
            ...item.metadata,
            subcategory: subcat.name,
            reorganized: "true",
            reorganizedAt: new Date().toISOString()
          }
        );
      }
    }

    // Update database
    await prisma.userProfileGraph.update({
      where: { userId: session.user.id },
      data: { graphData: currentXml }
    });

    // Get updated graph data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    });

    const updatedGraphData = parseXmlToGraph(
      currentXml,
      session.user.id,
      user?.name || undefined
    );

    console.log("✅ [Reorganize API] Reorganization complete");

    return NextResponse.json({
      success: true,
      message: `Successfully reorganized "${category}" into ${organization.subcategories.length} subcategories`,
      subcategories: organization.subcategories.map(s => ({
        name: s.name,
        itemCount: s.items.length,
        reasoning: s.reasoning
      })),
      confidence: organization.confidence,
      reasoning: organization.reasoning,
      graphData: updatedGraphData,
      xmlData: currentXml
    });

  } catch (error) {
    console.error("❌ [Reorganize API] Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to reorganize category",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check which categories need reorganization
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get profile graph
    const profileGraph = await getUserProfileGraph(session.user.id);
    
    // Find categories that need reorganization
    const categoriesNeedingReorg: Array<{
      category: string;
      itemCount: number;
      reason: string;
    }> = [];

    const categories = profileGraph.graphData.nodes.filter(n => n.type === 'category');
    
    for (const category of categories) {
      const itemsInCategory = profileGraph.graphData.nodes.filter(
        n => n.type === 'item' && n.category === category.category
      );
      
      if (itemsInCategory.length >= 6) {
        categoriesNeedingReorg.push({
          category: category.category!,
          itemCount: itemsInCategory.length,
          reason: `Has ${itemsInCategory.length} items (max is 5 before reorganization)`
        });
      }
    }

    return NextResponse.json({
      success: true,
      needsReorganization: categoriesNeedingReorg.length > 0,
      categories: categoriesNeedingReorg
    });

  } catch (error) {
    console.error("❌ [Reorganize API] Error checking reorganization needs:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to check reorganization needs",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
