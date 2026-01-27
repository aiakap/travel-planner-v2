// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env and .env.local
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

import { generatePlaceSuggestions } from "@/lib/ai/generate-place-suggestions";
import { resolvePlaces } from "@/lib/google-places/resolve-suggestions";
import { assemblePlaceLinks } from "@/lib/html/assemble-place-links";

async function testHotelSuggestions() {
  // Verify API keys are loaded
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not found in environment");
    console.error("   Make sure .env or .env.local contains OPENAI_API_KEY");
    process.exit(1);
  }
  
  const googleKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!googleKey) {
    console.error("❌ Google Places/Maps API key not found in environment");
    console.error("   Make sure .env or .env.local contains GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY");
    process.exit(1);
  }
  
  console.log("✅ Environment variables loaded");
  console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY.substring(0, 8)}...`);
  console.log(`   GOOGLE_MAPS_API_KEY: ${googleKey.substring(0, 8)}...`);
  
  console.log("=".repeat(80));
  console.log("TESTING HOTEL SUGGESTIONS PIPELINE");
  console.log("=".repeat(80));
  
  const query = "Suggest hotels in Niseko";
  
  // Stage 1: Generate
  console.log("\n[1] Generating AI response...");
  const stage1 = await generatePlaceSuggestions(query);
  console.log(`✅ Generated: ${stage1.text.length} chars`);
  console.log(`   Places: ${(stage1 as any).places?.length || 0}`);
  console.log(`\n   Text: "${stage1.text}"\n`);
  
  if ((stage1 as any).places) {
    console.log(`   Places array:`);
    (stage1 as any).places.forEach((p: any, i: number) => {
      console.log(`     ${i + 1}. ${p.suggestedName} (${p.category}/${p.type})`);
    });
  }
  
  // Stage 2: Resolve
  console.log("\n[2] Resolving with Google Places...");
  const stage2 = await resolvePlaces((stage1 as any).places || []);
  console.log(`✅ Resolved: ${Object.keys(stage2.placeMap).length} places`);
  
  // Stage 3: Assemble
  console.log("\n[3] Assembling segments...");
  const stage3 = assemblePlaceLinks(
    stage1.text,
    (stage1 as any).places || [],
    stage2.placeMap
  );
  console.log(`✅ Created: ${stage3.segments.length} segments`);
  console.log(`   Place segments: ${stage3.segments.filter(s => s.type === "place").length}`);
  
  // Detailed segment analysis
  console.log("\n[4] Segment Analysis:");
  stage3.segments.forEach((seg, idx) => {
    if (seg.type === "place") {
      console.log(`   ${idx}: PLACE - "${seg.display}" (has data: ${!!seg.placeData})`);
    } else if (seg.type === "text") {
      console.log(`   ${idx}: TEXT - "${seg.content?.substring(0, 60)}..."`);
    }
  });
  
  console.log("\n" + "=".repeat(80));
}

testHotelSuggestions().catch(console.error);
