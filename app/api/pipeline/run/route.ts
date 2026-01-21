import { NextRequest, NextResponse } from "next/server";
import { generatePlaceSuggestions } from "@/lib/ai/generate-place-suggestions";
import { resolvePlaces } from "@/lib/google-places/resolve-suggestions";
import { assemblePlaceLinks } from "@/lib/html/assemble-place-links";
import { PipelineRequest, PipelineResponse } from "@/lib/types/place-pipeline";

export const maxDuration = 60; // Allow up to 60 seconds for the pipeline

/**
 * Main Pipeline API Route
 * 
 * POST /api/pipeline/run
 * 
 * Orchestrates all 3 stages of the place suggestion pipeline:
 * 1. AI generates structured text + place list
 * 2. Google Places API resolves each place
 * 3. Assembly creates segments with clickable links
 */
export async function POST(req: NextRequest) {
  try {
    const body: PipelineRequest = await req.json();
    const { query, tripContext, stages } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query is required" },
        { status: 400 }
      );
    }

    console.log("\n" + "=".repeat(80));
    console.log("🚀 PIPELINE START");
    console.log("   Query:", query);
    console.log("   Requested stages:", stages || "all");
    console.log("=".repeat(80));

    const response: PipelineResponse = {
      success: true,
      data: {},
    };

    // Stage 1: AI Generation
    if (!stages || stages.includes("stage1")) {
      const stage1Start = Date.now();
      console.log("\n📍 STAGE 1: AI Generation");
      
      try {
        const stage1Output = await generatePlaceSuggestions(query, tripContext);
        const stage1Timing = Date.now() - stage1Start;
        
        response.data!.stage1 = {
          ...stage1Output,
          timing: stage1Timing,
        };
        
        console.log(`✅ Stage 1 complete (${stage1Timing}ms)`);
        console.log(`   Generated ${stage1Output.places.length} place suggestions`);
      } catch (error) {
        console.error("❌ Stage 1 failed:", error);
        return NextResponse.json(
          {
            success: false,
            error: `Stage 1 failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
          { status: 500 }
        );
      }
    }

    // Stage 2: Google Places Resolution
    if (!stages || stages.includes("stage2")) {
      if (!response.data!.stage1) {
        return NextResponse.json(
          { success: false, error: "Stage 1 must complete before Stage 2" },
          { status: 400 }
        );
      }

      const stage2Start = Date.now();
      console.log("\n📍 STAGE 2: Google Places Resolution");
      
      try {
        const stage2Output = await resolvePlaces(response.data!.stage1.places);
        const stage2Timing = Date.now() - stage2Start;
        
        response.data!.stage2 = {
          ...stage2Output,
          timing: stage2Timing,
        };
        
        const successCount = Object.values(stage2Output.placeMap).filter(
          p => !p.notFound
        ).length;
        
        console.log(`✅ Stage 2 complete (${stage2Timing}ms)`);
        console.log(`   Resolved ${successCount}/${response.data!.stage1.places.length} places`);
      } catch (error) {
        console.error("❌ Stage 2 failed:", error);
        return NextResponse.json(
          {
            success: false,
            error: `Stage 2 failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            data: response.data,
          },
          { status: 500 }
        );
      }
    }

    // Stage 3: HTML Assembly
    if (!stages || stages.includes("stage3")) {
      if (!response.data!.stage1 || !response.data!.stage2) {
        return NextResponse.json(
          { success: false, error: "Stages 1 and 2 must complete before Stage 3" },
          { status: 400 }
        );
      }

      const stage3Start = Date.now();
      console.log("\n📍 STAGE 3: HTML Assembly");
      
      try {
        const stage3Output = assemblePlaceLinks(
          response.data!.stage1.text,
          response.data!.stage1.places,
          response.data!.stage2.placeMap
        );
        const stage3Timing = Date.now() - stage3Start;
        
        response.data!.stage3 = {
          ...stage3Output,
          timing: stage3Timing,
        };
        
        const placeSegments = stage3Output.segments.filter(s => s.type === "place").length;
        
        console.log(`✅ Stage 3 complete (${stage3Timing}ms)`);
        console.log(`   Created ${stage3Output.segments.length} segments (${placeSegments} places)`);
      } catch (error) {
        console.error("❌ Stage 3 failed:", error);
        return NextResponse.json(
          {
            success: false,
            error: `Stage 3 failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            data: response.data,
          },
          { status: 500 }
        );
      }
    }

    const totalTiming = 
      (response.data!.stage1?.timing || 0) +
      (response.data!.stage2?.timing || 0) +
      (response.data!.stage3?.timing || 0);

    console.log("\n" + "=".repeat(80));
    console.log("🎉 PIPELINE COMPLETE");
    console.log(`   Total time: ${totalTiming}ms`);
    console.log("=".repeat(80) + "\n");

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Pipeline error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
