import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env file
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("API Key loaded:", process.env.OPENAI_API_KEY ? "✅ Yes" : "❌ No");

async function testAIJson() {
  console.log("Testing AI JSON generation...\n");

  try {
    const result = await generateText({
      model: openai("gpt-4o-2024-11-20"),
      system: "You must output valid JSON with two fields: 'text' and 'places' (an array).",
      prompt: "Suggest 2 hotels in Paris",
      temperature: 0.7,
      maxTokens: 500,
      experimental_providerMetadata: {
        openai: {
          response_format: { type: "json_object" },
        },
      },
    });

    console.log("✅ AI Response received");
    console.log("Response length:", result.text.length);
    console.log("First 200 chars:", result.text.substring(0, 200));
    console.log("\nFull response:");
    console.log(result.text);
    console.log("\nTrying to parse JSON...");
    
    const parsed = JSON.parse(result.text);
    console.log("✅ JSON parsed successfully!");
    console.log("Keys:", Object.keys(parsed));
    console.log("\nParsed object:");
    console.log(JSON.stringify(parsed, null, 2));
  } catch (error) {
    console.error("❌ Error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  }
}

testAIJson();
