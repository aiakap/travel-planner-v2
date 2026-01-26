import { config } from "dotenv";
import { getVertexAIClient } from "../image-generator/lib/vertex-ai-client";
import { v4 as uuidv4 } from "uuid";

// Load environment variables from .env
config();

async function testVertexAI() {
  console.log("\n=== Testing Vertex AI Imagen ===");
  console.log("Project:", process.env.GOOGLE_CLOUD_PROJECT);
  console.log("Location:", process.env.GOOGLE_CLOUD_LOCATION);
  console.log("Credentials:", process.env.GOOGLE_APPLICATION_CREDENTIALS);
  console.log("");
  
  try {
    const client = getVertexAIClient();
    const filename = `test-${uuidv4()}.png`;
    
    console.log("Generating image with prompt: 'A beautiful sunset over mountains'");
    console.log("This may take 5-10 seconds...\n");
    
    const result = await client.generateImage(
      {
        prompt: "A beautiful sunset over mountains",
        aspectRatio: "1:1",
      },
      filename
    );
    
    console.log("✅ Success! Image generated:");
    console.log("  Output path:", result.outputPath);
    console.log("  Duration:", result.duration, "ms");
    console.log("  API call ID:", result.apiCallId);
    console.log("\n✅ Vertex AI integration is working correctly!");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testVertexAI();
