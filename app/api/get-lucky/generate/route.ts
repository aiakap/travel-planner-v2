import { auth } from "@/auth";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { expResponseSchema } from "@/lib/schemas/exp-response-schema";
import { buildGetLuckySystemPrompt, buildGetLuckyUserMessage, type TripGenerationParams } from "@/lib/ai/get-lucky-full-generation-prompt";
import { getActivityDensity, calculateStaySegments, distributeDaysAcrossStays } from "@/lib/utils/profile-helpers";
import { createDraftTrip, syncSegments, updateTripMetadata } from "@/app/trip/new/actions/trip-builder-actions";
import { createReservationFromSuggestion } from "@/lib/actions/create-reservation";
import { generateGetLuckyPrompt } from "@/lib/ai/get-lucky-prompts";
import { prisma } from "@/lib/prisma";
import { TripStatus } from "@/app/generated/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface StreamEvent {
  type: 'stage' | 'item' | 'trip_updated' | 'complete' | 'error';
  stage?: string;
  message?: string;
  data?: any;
}

function sendSSE(controller: ReadableStreamDefaultController, event: StreamEvent) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  controller.enqueue(new TextEncoder().encode(data));
}

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { profileData, destination, budgetLevel, activityLevel, conversationId, tripId } = body;

    // Log request start
    console.log('🎲 [GET_LUCKY:START] Request received', {
      destination,
      budgetLevel,
      activityLevel,
      conversationId,
      tripId,
      hasProfileData: !!profileData,
      timestamp: new Date().toISOString(),
    });

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stage 1: Planning
          sendSSE(controller, {
            type: 'stage',
            stage: 'planning',
            message: 'Planning your chapters...',
          });

          console.log('🎲 [GET_LUCKY:STAGE] Planning started');

          // Extract lucky prompt parameters
          const luckyData = generateGetLuckyPrompt(destination, budgetLevel);
          const datesMatch = luckyData.match(/\*\*Dates:\*\* (\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})/);
          const destMatch = luckyData.match(/\*\*Destination:\*\* ([^\n]+)/);
          const highlightsMatch = luckyData.match(/Known highlights of [^:]+: ([^\n]+)/);
          const travelersMatch = luckyData.match(/\*\*Travelers:\*\* ([^\n]+)/);

          const startDate = datesMatch?.[1] || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const endDate = datesMatch?.[2] || new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const destinationName = destMatch?.[1]?.trim() || destination || 'Paris, France';
          const highlights = highlightsMatch?.[1]?.trim();
          const travelers = travelersMatch?.[1]?.trim() || 'solo traveler';

          const durationDays = Math.ceil(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
          );

          const activityDensity = getActivityDensity(activityLevel || 'Moderate');

          // Build AI prompt
          const promptParams: TripGenerationParams = {
            destination: destinationName,
            destinationHighlights: highlights,
            startDate,
            endDate,
            durationDays,
            budgetLevel: budgetLevel || 'moderate',
            activityLevel: activityLevel || 'Moderate',
            activityDensity,
            accommodation: profileData?.preferences?.find((p: any) => p.preferenceType?.name === 'accommodation_preference')?.option?.label || 'Hotel',
            travelPace: profileData?.preferences?.find((p: any) => p.preferenceType?.name === 'pace_preference')?.option?.label || 'Balanced',
            travelers,
            homeCity: profileData?.city,
          };

          console.log('🎲 [GET_LUCKY:PROMPT_PARAMS] Trip parameters', {
            destination: destinationName,
            startDate,
            endDate,
            durationDays,
            activityDensity,
            budgetLevel: promptParams.budgetLevel,
            activityLevel: promptParams.activityLevel,
          });

          const systemPrompt = buildGetLuckySystemPrompt(promptParams);
          const userMessage = buildGetLuckyUserMessage(promptParams);

          console.log('🎲 [GET_LUCKY:PROMPTS] Prompts built', {
            systemPromptLength: systemPrompt.length,
            userMessageLength: userMessage.length,
          });

          // Convert and validate schema
          const convertedSchema = zodToJsonSchema(expResponseSchema, { target: 'openAi' });
          
          console.log('🎲 [GET_LUCKY:SCHEMA] Schema converted', {
            schemaSize: JSON.stringify(convertedSchema).length,
            schemaType: convertedSchema.type,
            hasProperties: !!convertedSchema.properties,
            propertyCount: convertedSchema.properties ? Object.keys(convertedSchema.properties).length : 0,
          });

          console.log('🎲 [GET_LUCKY:OPENAI_REQUEST] Calling OpenAI', {
            model: 'gpt-4o-2024-08-06',
            temperature: 0.9,
            responseFormat: 'json_schema',
          });

          // Call OpenAI with structured output
          let completion;
          try {
            completion = await openai.chat.completions.create({
              model: "gpt-4o-2024-08-06",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
              ],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "trip_generation",
                  strict: true,
                  schema: convertedSchema as any,
                },
              },
              temperature: 0.9, // Higher creativity for varied trips
            });

            console.log('🎲 [GET_LUCKY:OPENAI_RESPONSE] Response received', {
              finishReason: completion.choices[0].finish_reason,
              tokensUsed: completion.usage?.total_tokens,
              promptTokens: completion.usage?.prompt_tokens,
              completionTokens: completion.usage?.completion_tokens,
              responseLength: completion.choices[0].message.content?.length,
            });
          } catch (error: any) {
            console.error('❌ [GET_LUCKY:OPENAI_ERROR] OpenAI API error', {
              error: error.message,
              type: error.type,
              code: error.code,
              param: error.param,
              statusCode: error.status,
              stack: error.stack,
            });
            throw error;
          }

          const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');
          console.log('🎲 [GET_LUCKY:PARSE] Response parsed', {
            hasText: !!aiResponse.text,
            cardCount: aiResponse.cards?.length || 0,
            placeCount: aiResponse.places?.length || 0,
            transportCount: aiResponse.transport?.length || 0,
            hotelCount: aiResponse.hotels?.length || 0,
          });

          // Stage 2: Update existing trip with AI-generated details
          sendSSE(controller, {
            type: 'stage',
            stage: 'route',
            message: 'Creating your journey...',
          });

          const tripCard = aiResponse.cards?.find((c: any) => c.type === 'trip_card');
          const tripTitle = tripCard?.title || `${destinationName} Adventure`;
          const tripDescription = tripCard?.description || aiResponse.text?.substring(0, 200);

          // Update the existing trip (instead of creating new one)
          console.log('🎲 [GET_LUCKY:DB_UPDATE] Updating trip', {
            tripId,
            title: tripTitle,
            startDate,
            endDate,
          });

          await prisma.trip.update({
            where: { id: tripId },
            data: {
              title: tripTitle,
              description: tripDescription,
              startDate: new Date(startDate),
              endDate: new Date(endDate),
            }
          });

          console.log('✅ [GET_LUCKY:DB_UPDATE] Trip updated successfully', { tripId });

          // Update conversation title
          if (conversationId) {
            // Helper function to format chat timestamp
            const formatChatTimestamp = (date: Date): string => {
              const month = date.getMonth() + 1;
              const day = date.getDate();
              const year = date.getFullYear().toString().slice(-2);
              
              let hours = date.getHours();
              const minutes = date.getMinutes();
              const ampm = hours >= 12 ? 'PM' : 'AM';
              
              hours = hours % 12;
              hours = hours ? hours : 12;
              
              const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
              
              return `${month}/${day}/${year} - ${hours}:${minutesStr} ${ampm}`;
            };
            
            await prisma.chatConversation.update({
              where: { id: conversationId },
              data: { 
                title: `${tripTitle} - ${formatChatTimestamp(new Date())}`,
              },
            });
            console.log(`✅ Conversation ${conversationId} renamed to ${tripTitle}`);
          }

          // Send trip_updated event so client can refresh the trip
          sendSSE(controller, {
            type: 'trip_updated',
            data: { 
              tripId, 
              tripName: tripTitle,
              startDate,
              endDate,
            },
          });

          // Extract segments from AI response
          const segmentCards = aiResponse.cards?.filter((c: any) => c.type === 'segment_card') || [];
          
          // Stage 3: Create segments
          const segmentsToCreate = [];
          let currentDate = new Date(startDate);
          const numStays = calculateStaySegments(durationDays);
          const dayDistribution = distributeDaysAcrossStays(durationDays, numStays);
          let dayOffset = 0;

          for (let i = 0; i < segmentCards.length; i++) {
            const card = segmentCards[i];
            const segmentDays = card.segmentType === 'Stay' ? dayDistribution[Math.floor(i / 2)] || 2 : 1;
            
            const segmentStartDate = new Date(currentDate);
            const segmentEndDate = new Date(segmentStartDate);
            segmentEndDate.setDate(segmentEndDate.getDate() + segmentDays);

            // Format dates as YYYY-MM-DD for wall date fields
            const formatDateStr = (d: Date): string => {
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            };
            
            segmentsToCreate.push({
              id: `temp-${i}`,
              type: card.segmentType || 'Stay',
              name: card.name || `Segment ${i + 1}`,
              days: segmentDays,
              start_location: card.startLocation || destinationName,
              end_location: card.endLocation || destinationName,
              start_image: null,
              end_image: null,
              order: i,
              startDate: formatDateStr(segmentStartDate),
              endDate: formatDateStr(segmentEndDate),
            });

            sendSSE(controller, {
              type: 'item',
              stage: 'route',
              message: `${card.name} (${segmentDays} days)`,
            });

            currentDate = segmentEndDate;
          }

          console.log('🎲 [GET_LUCKY:DB_SEGMENTS] Creating segments', {
            count: segmentsToCreate.length,
            tripId,
          });

          await syncSegments(tripId, segmentsToCreate);
          console.log('✅ [GET_LUCKY:DB_SEGMENTS] Segments created successfully', {
            count: segmentsToCreate.length,
          });

          // Fetch created segments with IDs
          const createdTrip = await prisma.trip.findUnique({
            where: { id: tripId },
            include: { segments: { orderBy: { startTime: 'asc' } } },
          });

          if (!createdTrip) {
            throw new Error('Trip not found after creation');
          }

          // Stage 4: Create hotels
          sendSSE(controller, {
            type: 'stage',
            stage: 'hotels',
            message: 'Finding hotels...',
          });

          const hotelPlaces = aiResponse.places?.filter((p: any) => p.category === 'Stay') || [];
          
          for (const place of hotelPlaces) {
            try {
              // Find matching segment
              const segmentIndex = createdTrip.segments.findIndex(
                (s: any) => s.type === 'Stay' && s.name.includes(place.searchQuery?.split(' ')[0])
              );
              const segment = segmentIndex >= 0 ? createdTrip.segments[segmentIndex] : createdTrip.segments[0];

              await createReservationFromSuggestion({
                suggestion: place,
                placeData: null, // Will be resolved by Google Places
                tripId,
                segmentId: segment.id,
                statusType: 'planned',
              });

              sendSSE(controller, {
                type: 'item',
                stage: 'hotels',
                message: `${place.suggestedName}`,
                data: { location: place.context?.notes || '' },
              });

              console.log(`✅ Hotel added: ${place.suggestedName}`);
            } catch (error) {
              console.error(`❌ Failed to create hotel: ${place.suggestedName}`, error);
            }
          }

          // Stage 5: Create restaurants
          sendSSE(controller, {
            type: 'stage',
            stage: 'restaurants',
            message: 'Finding restaurants...',
          });

          const restaurantPlaces = aiResponse.places?.filter((p: any) => p.category === 'Eat') || [];
          
          for (const place of restaurantPlaces) {
            try {
              // Find matching segment by day
              const dayNumber = place.context?.dayNumber || 1;
              const segment = createdTrip.segments[Math.min(dayNumber - 1, createdTrip.segments.length - 1)] || createdTrip.segments[0];

              await createReservationFromSuggestion({
                suggestion: place,
                placeData: null,
                tripId,
                segmentId: segment.id,
                statusType: 'suggested',
              });

              sendSSE(controller, {
                type: 'item',
                stage: 'restaurants',
                message: `${place.suggestedName} (Day ${dayNumber}, ${place.context?.timeOfDay})`,
              });

              console.log(`✅ Restaurant added: ${place.suggestedName}`);
            } catch (error) {
              console.error(`❌ Failed to create restaurant: ${place.suggestedName}`, error);
            }
          }

          // Stage 6: Create activities
          sendSSE(controller, {
            type: 'stage',
            stage: 'activities',
            message: 'Adding activities...',
          });

          const activityPlaces = aiResponse.places?.filter((p: any) => p.category === 'Do') || [];
          
          for (const place of activityPlaces) {
            try {
              const dayNumber = place.context?.dayNumber || 1;
              const segment = createdTrip.segments[Math.min(dayNumber - 1, createdTrip.segments.length - 1)] || createdTrip.segments[0];

              await createReservationFromSuggestion({
                suggestion: place,
                placeData: null,
                tripId,
                segmentId: segment.id,
                statusType: 'suggested',
              });

              sendSSE(controller, {
                type: 'item',
                stage: 'activities',
                message: `${place.suggestedName} (Day ${dayNumber})`,
                data: { time: place.context?.specificTime || '' },
              });

              console.log(`✅ Activity added: ${place.suggestedName}`);
            } catch (error) {
              console.error(`❌ Failed to create activity: ${place.suggestedName}`, error);
            }
          }

          // Finalize trip (change from DRAFT to ACTIVE)
          await prisma.trip.update({
            where: { id: tripId },
            data: { status: TripStatus.ACTIVE },
          });

          // Stage 7: Complete
          sendSSE(controller, {
            type: 'complete',
            message: 'Your trip is ready!',
            data: { tripId },
          });

          console.log('✅ [GET_LUCKY:COMPLETE] Trip generation complete', {
            tripId,
            totalSegments: segmentsToCreate.length,
            totalHotels: hotelPlaces.length,
            totalRestaurants: restaurantPlaces.length,
            totalActivities: activityPlaces.length,
          });
          controller.close();
        } catch (error: any) {
          console.error('❌ [GET_LUCKY:ERROR] Generation failed', {
            error: error.message,
            type: error.type || error.name,
            code: error.code,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          });
          sendSSE(controller, {
            type: 'error',
            message: error instanceof Error ? error.message : 'Generation failed',
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('❌ Get Lucky API error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
