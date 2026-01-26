import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { generatePlaceSuggestions } from "@/lib/ai/generate-place-suggestions";
import { resolvePlaces } from "@/lib/google-places/resolve-suggestions";
import { assemblePlaceLinks } from "@/lib/html/assemble-place-links";
import { MessageSegment } from "@/lib/types/place-pipeline";
import { prisma } from "@/lib/prisma";
import { parseIntentFromResponse } from "@/lib/ai/parse-intent";
import { createFullItinerary } from "@/lib/actions/create-full-itinerary";
import { parseCardsFromText } from "@/app/exp/lib/parse-card-syntax";
import { validateAIResponse, formatValidationErrors } from "@/lib/ai/validate-ai-response";

export const maxDuration = 60;

// Helper to get trip context for the conversation
async function getTripContext(conversationId: string, userId: string): Promise<string | null> {
  try {
    // Get conversation with trip info, segment info, and reservation info
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      include: {
        trip: {
          include: {
            segments: {
              include: {
                segmentType: true,
                reservations: {
                  include: {
                    reservationType: {
                      include: {
                        category: true,
                      },
                    },
                    reservationStatus: true,
                  },
                  orderBy: {
                    startTime: 'asc',
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        segment: {
          include: {
            segmentType: true,
            reservations: {
              include: {
                reservationType: {
                  include: {
                    category: true,
                  },
                },
                reservationStatus: true,
              },
              orderBy: {
                startTime: 'asc',
              },
            },
          },
        },
        reservation: {
          include: {
            reservationType: {
              include: {
                category: true,
              },
            },
            reservationStatus: true,
            segment: {
              include: {
                segmentType: true,
              },
            },
          },
        },
      },
    });

    if (!conversation?.trip) {
      return null;
    }

    const trip = conversation.trip;
    const chatType = conversation.chatType;
    const focusedSegment = conversation.segment;
    const focusedReservation = conversation.reservation;

    let context = '';

    // Add conversation context header to specify what entity is being discussed
    context += `\n\n## CONVERSATION CONTEXT\n\n`;
    
    if (chatType === 'SEGMENT' && focusedSegment) {
      context += `You are discussing: [SEGMENT] "${focusedSegment.name}" in trip "${trip.title}"\n`;
      context += `Focus: This conversation is specifically about the "${focusedSegment.name}" segment.\n\n`;
      
      // Detailed segment information
      context += `## FOCUSED SEGMENT DETAILS\n\n`;
      context += `**Segment: ${focusedSegment.name}**\n`;
      context += `- Type: ${focusedSegment.segmentType.name}\n`;
      context += `- From: ${focusedSegment.startTitle}\n`;
      context += `- To: ${focusedSegment.endTitle}\n`;
      if (focusedSegment.startTime) {
        context += `- Start: ${new Date(focusedSegment.startTime).toLocaleString()}\n`;
      }
      if (focusedSegment.endTime) {
        context += `- End: ${new Date(focusedSegment.endTime).toLocaleString()}\n`;
      }
      if (focusedSegment.notes) {
        context += `- Notes: ${focusedSegment.notes}\n`;
      }
      context += `- Segment ID: ${focusedSegment.id}\n`;

      if (focusedSegment.reservations.length > 0) {
        context += `\n**Reservations in this segment (${focusedSegment.reservations.length}):**\n`;
        focusedSegment.reservations.forEach((res, resIdx) => {
          context += `${resIdx + 1}. ${res.name}\n`;
          context += `   - Category: ${res.reservationType.category.name}\n`;
          context += `   - Type: ${res.reservationType.name}\n`;
          context += `   - Status: ${res.reservationStatus.name}\n`;
          if (res.startTime) {
            context += `   - Time: ${new Date(res.startTime).toLocaleString()}`;
            if (res.endTime) {
              context += ` to ${new Date(res.endTime).toLocaleTimeString()}`;
            }
            context += `\n`;
          }
          if (res.location) {
            context += `   - Location: ${res.location}\n`;
          }
          if (res.cost) {
            context += `   - Cost: ${res.currency || '$'}${res.cost}\n`;
          }
          if (res.confirmationNumber) {
            context += `   - Confirmation: ${res.confirmationNumber}\n`;
          }
          context += `   - Reservation ID: ${res.id}\n`;
        });
      } else {
        context += `\nNo reservations in this segment yet.\n`;
      }
      context += `\n`;
      
    } else if (chatType === 'RESERVATION' && focusedReservation) {
      const parentSegment = focusedReservation.segment;
      context += `You are discussing: [RESERVATION] "${focusedReservation.name}"\n`;
      context += `- In segment: "${parentSegment?.name || 'Unknown'}"\n`;
      context += `- Part of trip: "${trip.title}"\n`;
      context += `Focus: This conversation is specifically about the "${focusedReservation.name}" reservation.\n\n`;
      
      // Detailed reservation information
      context += `## FOCUSED RESERVATION DETAILS\n\n`;
      context += `**Reservation: ${focusedReservation.name}**\n`;
      context += `- Category: ${focusedReservation.reservationType.category.name}\n`;
      context += `- Type: ${focusedReservation.reservationType.name}\n`;
      context += `- Status: ${focusedReservation.reservationStatus.name}\n`;
      if (focusedReservation.vendor) {
        context += `- Vendor: ${focusedReservation.vendor}\n`;
      }
      if (focusedReservation.startTime) {
        context += `- Start Time: ${new Date(focusedReservation.startTime).toLocaleString()}`;
        if (focusedReservation.endTime) {
          context += ` to ${new Date(focusedReservation.endTime).toLocaleString()}`;
        }
        context += `\n`;
      }
      if (focusedReservation.location) {
        context += `- Location: ${focusedReservation.location}\n`;
      }
      if (focusedReservation.cost) {
        context += `- Cost: ${focusedReservation.currency || '$'}${focusedReservation.cost}\n`;
      }
      if (focusedReservation.confirmationNumber) {
        context += `- Confirmation: ${focusedReservation.confirmationNumber}\n`;
      }
      if (focusedReservation.contactPhone) {
        context += `- Contact Phone: ${focusedReservation.contactPhone}\n`;
      }
      if (focusedReservation.contactEmail) {
        context += `- Contact Email: ${focusedReservation.contactEmail}\n`;
      }
      if (focusedReservation.url) {
        context += `- Website: ${focusedReservation.url}\n`;
      }
      if (focusedReservation.notes) {
        context += `- Notes: ${focusedReservation.notes}\n`;
      }
      if (focusedReservation.cancellationPolicy) {
        context += `- Cancellation Policy: ${focusedReservation.cancellationPolicy}\n`;
      }
      context += `- Reservation ID: ${focusedReservation.id}\n\n`;

      // Parent segment context
      if (parentSegment) {
        context += `## PARENT SEGMENT CONTEXT\n\n`;
        context += `**Segment: ${parentSegment.name}**\n`;
        context += `- Type: ${parentSegment.segmentType.name}\n`;
        context += `- From: ${parentSegment.startTitle}\n`;
        context += `- To: ${parentSegment.endTitle}\n`;
        if (parentSegment.startTime) {
          context += `- Dates: ${new Date(parentSegment.startTime).toLocaleDateString()}`;
          if (parentSegment.endTime) {
            context += ` to ${new Date(parentSegment.endTime).toLocaleDateString()}`;
          }
          context += `\n`;
        }
        context += `- Segment ID: ${parentSegment.id}\n\n`;
      }
      
    } else {
      // TRIP context (default)
      context += `You are discussing: [TRIP] "${trip.title}"\n`;
      context += `Focus: This conversation is about the overall trip.\n\n`;
    }

    // Add full trip context for all conversation types
    context += `## PARENT TRIP CONTEXT\n\n`;
    context += `**Trip: "${trip.title}"**\n`;
    context += `Description: ${trip.description}\n`;
    context += `Dates: ${new Date(trip.startDate).toLocaleDateString()} to ${new Date(trip.endDate).toLocaleDateString()}\n`;
    context += `Trip ID: ${trip.id}\n\n`;

    if (trip.segments.length > 0) {
      context += `### All Trip Segments (${trip.segments.length} total):\n\n`;

      trip.segments.forEach((segment, idx) => {
        const isFocused = chatType === 'SEGMENT' && segment.id === focusedSegment?.id;
        context += `**Segment ${idx + 1}: ${segment.name}${isFocused ? ' ⭐ (FOCUSED)' : ''}**\n`;
        context += `- Type: ${segment.segmentType.name}\n`;
        context += `- From: ${segment.startTitle}\n`;
        context += `- To: ${segment.endTitle}\n`;
        if (segment.startTime) {
          context += `- Start: ${new Date(segment.startTime).toLocaleString()}\n`;
        }
        if (segment.endTime) {
          context += `- End: ${new Date(segment.endTime).toLocaleString()}\n`;
        }
        if (segment.notes) {
          context += `- Notes: ${segment.notes}\n`;
        }
        context += `- Segment ID: ${segment.id}\n`;

        if (segment.reservations.length > 0) {
          context += `\n  **Reservations in this segment (${segment.reservations.length}):**\n`;
          segment.reservations.forEach((res, resIdx) => {
            const isResFocused = chatType === 'RESERVATION' && res.id === focusedReservation?.id;
            context += `  ${resIdx + 1}. ${res.name}${isResFocused ? ' ⭐ (FOCUSED)' : ''}\n`;
            context += `     - Category: ${res.reservationType.category.name}\n`;
            context += `     - Type: ${res.reservationType.name}\n`;
            context += `     - Status: ${res.reservationStatus.name}\n`;
            if (res.startTime) {
              context += `     - Time: ${new Date(res.startTime).toLocaleString()}`;
              if (res.endTime) {
                context += ` to ${new Date(res.endTime).toLocaleTimeString()}`;
              }
              context += `\n`;
            }
            if (res.location) {
              context += `     - Location: ${res.location}\n`;
            }
            if (res.cost) {
              context += `     - Cost: ${res.currency || '$'}${res.cost}\n`;
            }
            if (res.confirmationNumber) {
              context += `     - Confirmation: ${res.confirmationNumber}\n`;
            }
            if (res.notes) {
              context += `     - Notes: ${res.notes}\n`;
            }
            context += `     - Reservation ID: ${res.id}\n`;
          });
        } else {
          context += `\n  No reservations in this segment yet.\n`;
        }
        context += `\n`;
      });
    } else {
      context += `No segments have been added to this trip yet.\n\n`;
    }

    context += `\n**IMPORTANT**: `;
    if (chatType === 'SEGMENT') {
      context += `This conversation is focused on the "${focusedSegment?.name}" segment. Keep your responses centered on this segment, but you have access to the full trip context if needed. `;
    } else if (chatType === 'RESERVATION') {
      context += `This conversation is focused on the "${focusedReservation?.name}" reservation. Keep your responses centered on this reservation, but you have access to the parent segment and full trip context if needed. `;
    } else {
      context += `This conversation is about the overall trip. `;
    }
    context += `When answering questions, always reference the specific details above. You have complete knowledge of all segments, reservations, times, locations, and costs. Use this information to provide accurate, contextual responses.\n`;

    return context;
  } catch (error) {
    console.error("[getTripContext] Error:", error);
    return null;
  }
}

// Helper to save message directly
async function saveMessageDirect({
  conversationId,
  userId,
  role,
  content,
}: {
  conversationId: string;
  userId: string;
  role: string;
  content: string;
}) {
  // Verify conversation belongs to user
  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      userId: userId,
    },
  });

  if (!conversation) {
    console.error("[saveMessageDirect] Conversation not found:", conversationId);
    return null;
  }

  const message = await prisma.chatMessage.create({
    data: {
      conversationId,
      role,
      content,
    },
  });

  // Update conversation timestamp
  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return message;
}

/**
 * Non-streaming chat API
 * 
 * This endpoint:
 * 1. Accepts a message and conversation history
 * 2. Calls AI to generate response with place suggestions
 * 3. Runs the 3-stage pipeline to resolve places and create segments
 * 4. Returns complete message with segments in one response
 */
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId, useExpPrompt } = await req.json();
    const userId = session.user.id;

    if (!message || !conversationId) {
      return NextResponse.json(
        { error: "Message and conversationId are required" },
        { status: 400 }
      );
    }

    console.log("\n" + "=".repeat(80));
    console.log("💬 [Simple Chat API] Processing message");
    console.log("   User:", userId);
    console.log("   Conversation:", conversationId);
    console.log("   Message:", message);
    console.log("=".repeat(80));

    // Get trip context
    const tripContext = await getTripContext(conversationId, userId);

    // Save user message
    await saveMessageDirect({
      conversationId,
      userId,
      role: "user",
      content: message,
    });

    // Stage 1: Generate AI response (NO TOOLS - just text and place suggestions)
    console.log("\n📍 Running 3-stage pipeline with server actions...");
    const stage1Start = Date.now();
    
    let stage1Output;
    try {
      // Pass trip context as part of the query for now
      const fullQuery = tripContext 
        ? `${message}\n\n${tripContext}`
        : message;
      
      // Use exp prompt if requested
      let customPrompt: string | undefined;
      if (useExpPrompt) {
        const { EXP_BUILDER_SYSTEM_PROMPT } = await import("@/app/exp/lib/exp-prompts");
        customPrompt = EXP_BUILDER_SYSTEM_PROMPT;
        console.log("🤖 [AI] Using EXP custom prompt");
      } else {
        console.log("🤖 [AI] Using default prompt");
      }
      
      stage1Output = await generatePlaceSuggestions(fullQuery, undefined, undefined, customPrompt);
      console.log(`✅ Stage 1 complete (${Date.now() - stage1Start}ms)`);
      console.log(`   Generated ${stage1Output.places.length} place suggestions`);
      console.log(`   Text length: ${stage1Output.text.length} chars`);
      
      // Validate AI response structure
      const validation = validateAIResponse(stage1Output);
      if (!validation.valid) {
        console.error("❌ [AI] Response validation failed:", formatValidationErrors(validation));
        console.error("   Response structure:", Object.keys(stage1Output));
        throw new Error(`Invalid AI response: ${validation.errors.join(", ")}`);
      }
      if (validation.warnings.length > 0) {
        console.warn("⚠️  [AI] Response warnings:", formatValidationErrors(validation));
      }
      
      // Check if response looks like hotel info but missing card syntax
      if (useExpPrompt && stage1Output.text.toLowerCase().includes('hotel') && 
          stage1Output.text.toLowerCase().includes('confirmation') &&
          !stage1Output.text.includes('[HOTEL_RESERVATION_CARD:')) {
        console.warn("⚠️  [AI] Response mentions hotel confirmation but missing HOTEL_RESERVATION_CARD syntax");
        console.warn("   Text preview:", stage1Output.text.substring(0, 300));
      }
    } catch (error) {
      console.error("❌ Stage 1 failed:", error);
      return NextResponse.json(
        { error: `Failed to generate response: ${error instanceof Error ? error.message : "Unknown error"}` },
        { status: 500 }
      );
    }

    // Stage 1.5: Parse intent and create trip if needed using server actions
    let tripCreated = false;
    let tripId: string | undefined;
    
    try {
      const intent = parseIntentFromResponse(stage1Output.text, (stage1Output as any).places || []);
      console.log(`   Intent parsed: shouldCreateTrip=${intent.shouldCreateTrip}`);
      
      if (intent.shouldCreateTrip && intent.destination && intent.startDate && intent.endDate) {
        console.log(`   Creating trip via server actions...`);
        console.log(`   - Destination: ${intent.destination}`);
        console.log(`   - Dates: ${intent.startDate.toLocaleDateString()} to ${intent.endDate.toLocaleDateString()}`);
        console.log(`   - Hotels: ${intent.hotels.length}`);
        console.log(`   - Restaurants: ${intent.restaurants.length}`);
        console.log(`   - Activities: ${intent.activities.length}`);
        
        const result = await createFullItinerary({
          destination: intent.destination,
          startDate: intent.startDate,
          endDate: intent.endDate,
          title: intent.title,
          description: intent.description,
          hotelNames: intent.hotels,
          restaurantNames: intent.restaurants,
          activityNames: intent.activities,
          conversationId,
          defaultStatus: "Pending", // Default for AI-created items
        });
        
        tripCreated = true;
        tripId = result.tripId;
        console.log(`   ✅ Trip created: ${tripId}`);
      }
    } catch (error) {
      console.error("❌ Failed to parse intent or create trip:", error);
      // Don't fail the whole request - continue with place suggestions
    }

    // Stage 2: Resolve places with Google Places API
    const stage2Start = Date.now();
    let stage2Output;
    try {
      const places = (stage1Output as any).places || [];
      stage2Output = await resolvePlaces(places);
      console.log(`✅ Stage 2 complete (${Date.now() - stage2Start}ms)`);
      const successCount = Object.values(stage2Output.placeMap).filter(
        p => !p.notFound
      ).length;
      console.log(`   Resolved ${successCount}/${places.length} places`);
    } catch (error) {
      console.error("❌ Stage 2 failed:", error);
      return NextResponse.json(
        { error: `Failed to resolve places: ${error instanceof Error ? error.message : "Unknown error"}` },
        { status: 500 }
      );
    }

    // Stage 2.5: Parse card syntax from AI response
    const { segments: cardSegments, cleanText } = parseCardsFromText(stage1Output.text);
    console.log(`   Parsed ${cardSegments.length} card segments from AI response`);
    if (cardSegments.length > 0) {
      console.log("   Card types:", cardSegments.map(s => s.type).join(", "));
    }
    
    // Update text to remove card syntax
    stage1Output.text = cleanText;

    // Stage 3: Assemble segments with clickable links
    const stage3Start = Date.now();
    let segments: MessageSegment[];
    try {
      const places = (stage1Output as any).places || [];
      const stage3Output = assemblePlaceLinks(
        stage1Output.text,
        places,
        stage2Output.placeMap
      );
      
      // Combine card segments with place segments
      segments = [...cardSegments, ...stage3Output.segments];
      
      console.log(`✅ Stage 3 complete (${Date.now() - stage3Start}ms)`);
      const placeSegments = segments.filter(s => s.type === "place").length;
      const cardCount = cardSegments.length;
      console.log(`   Created ${segments.length} segments (${placeSegments} places, ${cardCount} cards)`);
    } catch (error) {
      console.error("❌ Stage 3 failed:", error);
      return NextResponse.json(
        { error: `Failed to assemble response: ${error instanceof Error ? error.message : "Unknown error"}` },
        { status: 500 }
      );
    }

    // Save assistant message
    await saveMessageDirect({
      conversationId,
      userId,
      role: "assistant",
      content: stage1Output.text,
    });

    const totalTime = Date.now() - stage1Start;
    console.log("\n" + "=".repeat(80));
    console.log("✅ [Simple Chat API] Complete");
    console.log(`   Total time: ${totalTime}ms`);
    console.log("=".repeat(80) + "\n");

    // Return the complete response with segments and trip info
    return NextResponse.json({
      role: "assistant",
      content: stage1Output.text,
      segments,
      tripCreated,
      tripId,
    });
  } catch (error) {
    console.error("[Simple Chat API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
