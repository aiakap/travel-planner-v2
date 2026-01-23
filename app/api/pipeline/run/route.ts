import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/ai/generate-content";
import { extractXmlMarkup } from "@/lib/ai/extract-xml-markup";
import { resolvePlaces } from "@/lib/google-places/resolve-suggestions";
import { resolveTransport, resolveHotels } from "@/lib/amadeus/resolve-suggestions";
import { assembleAmadeusLinks } from "@/lib/html/assemble-amadeus-links";
import { PipelineRequest, PipelineResponse, PlaceEntity, TransportEntity, HotelEntity } from "@/lib/types/amadeus-pipeline";

export const maxDuration = 60; // Allow up to 60 seconds for the pipeline

/**
 * Main Pipeline API Route (4-Stage Architecture)
 * 
 * POST /api/pipeline/run
 * 
 * Orchestrates all 4 stages of the place suggestion pipeline:
 * 1. Content Generation - AI creates natural language with intentions
 * 2. XML Extraction - AI marks up text and extracts entities
 * 3. API Lookups - Resolve entities via Google Places & Amadeus
 * 4. HTML Assembly - Create interactive segments with hover cards
 */
export async function POST(req: NextRequest) {
  try {
    const body: PipelineRequest = await req.json();
    const { query, destination, profileData, tripContext, stages } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query is required" },
        { status: 400 }
      );
    }

    console.log("\n" + "=".repeat(80));
    console.log("🚀 PIPELINE START (4-Stage Architecture)");
    console.log("   Query:", query);
    console.log("   Requested stages:", stages || "all");
    console.log("=".repeat(80));

    const response: PipelineResponse = {
      success: true,
      data: {},
    };

    // Stage 1: Content Generation
    if (!stages || stages.includes("stage1")) {
      const stage1Start = Date.now();
      console.log("\n📝 STAGE 1: Content Generation");
      
      try {
        const stage1Output = await generateContent(query, tripContext);
        const stage1Timing = Date.now() - stage1Start;
        
        response.data!.stage1 = {
          ...stage1Output,
          timing: stage1Timing,
        };
        
        console.log(`✅ Stage 1 complete (${stage1Timing}ms)`);
        console.log(`   Text length: ${stage1Output.text.length} chars`);
        console.log(`   Natural language: ${stage1Output.naturalLanguageSection.length} chars`);
        console.log(`   Lookup requirements: ${stage1Output.lookupRequirements.length} chars`);
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

    // Stage 2: XML Extraction
    if (!stages || stages.includes("stage2")) {
      if (!response.data!.stage1) {
        return NextResponse.json(
          { success: false, error: "Stage 1 must complete before Stage 2" },
          { status: 400 }
        );
      }

      const stage2Start = Date.now();
      console.log("\n🏷️  STAGE 2: XML Extraction");
      
      try {
        const stage2Output = await extractXmlMarkup(
          response.data!.stage1.naturalLanguageSection,
          response.data!.stage1.lookupRequirements
        );
        const stage2Timing = Date.now() - stage2Start;
        
        response.data!.stage2 = {
          ...stage2Output,
          timing: stage2Timing,
        };
        
        console.log(`✅ Stage 2 complete (${stage2Timing}ms)`);
        console.log(`   Marked text: ${stage2Output.markedText.length} chars`);
        console.log(`   Places: ${stage2Output.places.length}`);
        console.log(`   Transport: ${stage2Output.transport.length}`);
        console.log(`   Hotels: ${stage2Output.hotels.length}`);
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

    // Stage 3: API Lookups (with 3 parallel sub-stages)
    if (!stages || stages.includes("stage3")) {
      if (!response.data!.stage2) {
        return NextResponse.json(
          { success: false, error: "Stage 2 must complete before Stage 3" },
          { status: 400 }
        );
      }

      const stage3Start = Date.now();
      console.log("\n🔍 STAGE 3: API Lookups (3 parallel sub-stages)");
      
      try {
        // Use entity lists from Stage 2
        const placeEntities = response.data!.stage2.places;
        const transportEntities = response.data!.stage2.transport;
        const hotelEntities = response.data!.stage2.hotels;

        console.log(`   - Stage 3A: ${placeEntities.length} Google Places lookups`);
        console.log(`   - Stage 3B: ${transportEntities.length} Transport lookups`);
        console.log(`   - Stage 3C: ${hotelEntities.length} Hotel lookups`);

        // Convert entities to format expected by resolvers
        const placeSuggestions = placeEntities.map((e: PlaceEntity) => ({
          suggestedName: e.name,
          category: "Do" as const,
          type: e.type,
          searchQuery: e.searchQuery,
          context: {},
          _entityId: e.id, // Add ID for mapping back
        }));

        const transportSuggestions = transportEntities.map((e: TransportEntity) => ({
          suggestedName: e.name,
          type: e.type,
          origin: e.origin,
          destination: e.destination,
          departureDate: e.departureDate,
          returnDate: e.returnDate,
          adults: e.adults,
          travelClass: (e.travelClass || "ECONOMY") as "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST",
          _entityId: e.id,
        }));

        const hotelSuggestions = hotelEntities.map((e: HotelEntity) => ({
          suggestedName: e.name,
          location: e.location,
          checkInDate: e.checkInDate,
          checkOutDate: e.checkOutDate,
          guests: e.guests,
          rooms: e.rooms,
          searchQuery: e.searchQuery,
          _entityId: e.id,
        }));

        // Execute all 3 sub-stages in parallel
        const [stage3A, stage3B, stage3C] = await Promise.all([
          // Stage 3A: Google Places Lookup
          (async () => {
            const subStart = Date.now();
            if (placeSuggestions.length === 0) {
              return { placeMap: {}, timing: 0 };
            }
            const result = await resolvePlaces(placeSuggestions);
            // Remap by entity ID
            const idMap: any = {};
            placeSuggestions.forEach(s => {
              if ((s as any)._entityId && result.placeMap[s.suggestedName]) {
                idMap[(s as any)._entityId] = result.placeMap[s.suggestedName];
              }
            });
            return { placeMap: idMap, timing: Date.now() - subStart };
          })(),
          
          // Stage 3B: Transport Lookup
          (async () => {
            const subStart = Date.now();
            if (transportSuggestions.length === 0) {
              return { transportMap: {}, timing: 0 };
            }
            const result = await resolveTransport(transportSuggestions);
            // Remap by entity ID
            const idMap: any = {};
            transportSuggestions.forEach(s => {
              if ((s as any)._entityId && result.transportMap[s.suggestedName]) {
                idMap[(s as any)._entityId] = result.transportMap[s.suggestedName];
              }
            });
            return { transportMap: idMap, timing: Date.now() - subStart };
          })(),
          
          // Stage 3C: Hotel Lookup
          (async () => {
            const subStart = Date.now();
            if (hotelSuggestions.length === 0) {
              return { hotelMap: {}, timing: 0 };
            }
            const result = await resolveHotels(hotelSuggestions);
            // Remap by entity ID
            const idMap: any = {};
            hotelSuggestions.forEach(s => {
              if ((s as any)._entityId && result.hotelMap[s.suggestedName]) {
                idMap[(s as any)._entityId] = result.hotelMap[s.suggestedName];
              }
            });
            return { hotelMap: idMap, timing: Date.now() - subStart };
          })(),
        ]);

        const stage3Timing = Date.now() - stage3Start;

        console.log(`✅ Stage 3A complete (${stage3A.timing}ms) - ${Object.keys(stage3A.placeMap).length} places`);
        console.log(`✅ Stage 3B complete (${stage3B.timing}ms) - ${Object.keys(stage3B.transportMap || {}).length} transport`);
        console.log(`✅ Stage 3C complete (${stage3C.timing}ms) - ${Object.keys(stage3C.hotelMap || {}).length} hotels`);

        response.data!.stage3 = {
          placeMap: stage3A.placeMap,
          transportMap: stage3B.transportMap || {},
          hotelMap: stage3C.hotelMap || {},
          timing: stage3Timing,
          subStages: {
            stage3A: { timing: stage3A.timing, count: Object.keys(stage3A.placeMap).length },
            stage3B: { timing: stage3B.timing, count: Object.keys(stage3B.transportMap || {}).length },
            stage3C: { timing: stage3C.timing, count: Object.keys(stage3C.hotelMap || {}).length },
          },
        };
        
        console.log(`✅ Stage 3 complete (${stage3Timing}ms)`);
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

    // Stage 4: HTML Assembly
    if (!stages || stages.includes("stage4")) {
      if (!response.data!.stage2 || !response.data!.stage3) {
        return NextResponse.json(
          { success: false, error: "Stages 2 and 3 must complete before Stage 4" },
          { status: 400 }
        );
      }

      const stage4Start = Date.now();
      console.log("\n🎨 STAGE 4: HTML Assembly");
      
      try {
        const stage4Output = assembleAmadeusLinks(
          response.data!.stage2.markedText,
          response.data!.stage2.places,
          response.data!.stage2.transport,
          response.data!.stage2.hotels,
          response.data!.stage3.placeMap,
          response.data!.stage3.transportMap,
          response.data!.stage3.hotelMap
        );
        const stage4Timing = Date.now() - stage4Start;
        
        response.data!.stage4 = {
          ...stage4Output,
          timing: stage4Timing,
        };
        
        const placeSegments = stage4Output.segments.filter(s => s.type === "place").length;
        const transportSegments = stage4Output.segments.filter(s => s.type === "transport" || s.type === "flight").length;
        const hotelSegments = stage4Output.segments.filter(s => s.type === "hotel").length;
        
        console.log(`✅ Stage 4 complete (${stage4Timing}ms)`);
        console.log(`   Created ${stage4Output.segments.length} segments (${placeSegments} places, ${transportSegments} transport, ${hotelSegments} hotels)`);
      } catch (error) {
        console.error("❌ Stage 4 failed:", error);
        return NextResponse.json(
          {
            success: false,
            error: `Stage 4 failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            data: response.data,
          },
          { status: 500 }
        );
      }
    }

    const totalTiming = 
      (response.data!.stage1?.timing || 0) +
      (response.data!.stage2?.timing || 0) +
      (response.data!.stage3?.timing || 0) +
      (response.data!.stage4?.timing || 0);

    console.log("\n" + "=".repeat(80));
    console.log("🎉 PIPELINE COMPLETE (4 Stages)");
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
