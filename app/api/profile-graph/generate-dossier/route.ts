import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const DossierSchema = z.object({
  sections: z.array(z.object({
    title: z.string(),
    content: z.string()
  }))
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { graphData } = await req.json();

    // Extract profile items from graph data
    const profileItems = graphData.nodes
      .filter((node: any) => node.type === 'item')
      .map((node: any) => ({
        category: node.category,
        subcategory: node.metadata?.subcategory || 'general',
        value: node.value
      }));

    // Generate dossier using AI
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: DossierSchema,
      prompt: `You are a luxury hotel concierge writing a confidential traveler dossier.

Profile data:
${JSON.stringify(profileItems, null, 2)}

Analyze the profile data and create a sophisticated traveler dossier with dynamic sections that best represent this guest's profile. The sections should be tailored to what information is actually present.

Section Guidelines:
- Create 3-6 sections with Roman numerals (I., II., III., etc.)
- Section titles should be descriptive and relevant to the actual data (e.g., "Travel Philosophy & Style", "Culinary Preferences & Dietary Considerations", "Accommodation Requirements", "Cultural Interests & Pastimes", "Wellness & Lifestyle", etc.)
- Skip or combine sections if certain data is not present
- If you notice interesting patterns, contradictions, or notable preferences, call them out elegantly in the narrative

Style guidelines:
- Write in third person ("The guest is...", "They prefer...", "One notes that...")
- Be specific and detailed, referencing exact preferences from the profile
- Professional, refined tone like a high-end hotel concierge
- Each section should be 2-4 sentences, flowing naturally
- Write in a flowing narrative style without any special formatting or brackets
- When describing preferences, weave them naturally into prose
- If there are contradictions or interesting contrasts (e.g., "budget-conscious yet seeking luxury experiences"), mention them with sophistication
- Provide insights that would help a concierge anticipate needs

Example tone: "The guest demonstrates a marked preference for boutique accommodations with design-forward aesthetics, though one notes an interesting tension between their environmental consciousness and frequent air travel habits."

Format each section with:
- Roman numeral and descriptive title
- Quote-wrapped paragraph in elegant prose
`
    });

    // Format the dossier content
    const dossierText = object.sections
      .map(section => `${section.title}\n\n"${section.content}"`)
      .join('\n\n');

    return NextResponse.json({
      dossier: dossierText,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error generating dossier:", error);
    return NextResponse.json(
      { error: "Failed to generate dossier" },
      { status: 500 }
    );
  }
}
