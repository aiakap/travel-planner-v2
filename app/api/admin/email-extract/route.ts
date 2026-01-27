import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { 
  validateFlightExtraction 
} from "@/lib/schemas/flight-extraction-schema";
import {
  validateHotelExtraction
} from "@/lib/schemas/hotel-extraction-schema";
import {
  validateCarRentalExtraction
} from "@/lib/schemas/car-rental-extraction-schema";
import {
  validateTrainExtraction
} from "@/lib/schemas/train-extraction-schema";
import {
  validateRestaurantExtraction
} from "@/lib/schemas/restaurant-extraction-schema";
import {
  validateEventExtraction
} from "@/lib/schemas/event-extraction-schema";
import {
  validateCruiseExtraction
} from "@/lib/schemas/cruise-extraction-schema";
import {
  validateGenericReservation
} from "@/lib/schemas/generic-reservation-schema";
import {
  validatePrivateDriverExtraction
} from "@/lib/schemas/extraction/travel/private-driver-extraction-schema";
import { validateOpenAISchema } from "@/lib/schemas/validate-openai-schema";
import { 
  validateOpenAISchema 
} from "@/lib/schemas/validate-openai-schema";
import { buildExtractionPrompt } from "@/lib/email-extraction";
import { getHandlerForType } from "@/lib/email-extraction/type-mapping";

type ReservationType = "flight" | "hotel" | "car-rental" | "train" | "restaurant" | "event" | "cruise" | "generic" | "private-driver";

export async function POST(request: NextRequest) {
  try {
    const { 
      emailText, 
      detectedType,
      userOverride = false,
      userFeedback = null,
      aiDetection = null
    } = await request.json();

    console.log(`📧 Email extraction request received, text length: ${emailText?.length || 0}`);
    if (detectedType) {
      console.log(`📋 Pre-detected type provided: ${detectedType}`);
      if (userOverride) {
        console.log(`🔄 User overrode AI selection`);
      }
    }

    if (!emailText) {
      console.error('❌ No email text provided');
      return NextResponse.json(
        { error: "Email text is required" },
        { status: 400 }
      );
    }

    // If a detected type is provided, use it directly
    // Otherwise, build extraction prompt using plugin system
    let extractionResult;
    
    if (detectedType) {
      console.log(`✅ Using pre-detected type: ${detectedType}`);
      
      // Look up handler info from database using shared mapping utility
      const handlerInfo = await getHandlerForType(detectedType);
      
      if (!handlerInfo) {
        console.error(`❌ No handler mapping found for detected type: ${detectedType}`);
        return NextResponse.json(
          { error: `Unsupported reservation type: ${detectedType}` },
          { status: 400 }
        );
      }
      
      console.log(`📋 Mapped "${handlerInfo.dbTypeName}" (${handlerInfo.category}) → ${handlerInfo.handler} → ${handlerInfo.pluginId}`);
      
      // Get the plugin from registry
      const { createExtractionRegistry } = await import('@/lib/email-extraction/build-extraction-prompt');
      const registry = createExtractionRegistry();
      const plugin = registry.get(handlerInfo.pluginId);
      
      if (!plugin) {
        console.error(`❌ No plugin found for plugin ID: ${handlerInfo.pluginId}`);
        return NextResponse.json(
          { error: `Plugin not found: ${handlerInfo.pluginId}` },
          { status: 500 }
        );
      }
      
      const { BASE_EXTRACTION_PROMPT } = await import('@/lib/email-extraction/base-extraction-prompt');
      const prompt = `${BASE_EXTRACTION_PROMPT}\n\n---\n\n${plugin.content}`;
      
      extractionResult = {
        prompt,
        schema: plugin.schema,
        extractionType: plugin.id,
        activePlugins: ['Base Prompt', plugin.name],
        stats: {
          totalLength: prompt.length,
          pluginCount: 2
        }
      };
    } else {
      // Original behavior: use pattern matching
      console.log(`🔌 Building extraction prompt with plugin system...`);
      try {
        extractionResult = buildExtractionPrompt({
          emailText,
          emailLength: emailText.length,
          detectedPatterns: []
        });
      } catch (error: any) {
        console.error('❌ Failed to build extraction prompt:', error.message);
        return NextResponse.json(
          { 
            error: error.message || "Unable to determine reservation type from email content",
            suggestion: "The email may not contain recognizable booking information. Please verify it's a confirmation email."
          },
          { status: 400 }
        );
      }
    }

    const { prompt, schema, extractionType, activePlugins, stats } = extractionResult;
    
    // Map plugin id to reservation type
    let reservationType: ReservationType;
    let validator: (data: unknown) => { success: boolean; data?: any; error?: string };
    
    if (extractionType === 'hotel-extraction') {
      reservationType = 'hotel';
      validator = validateHotelExtraction;
    } else if (extractionType === 'car-rental-extraction') {
      reservationType = 'car-rental';
      validator = validateCarRentalExtraction;
    } else if (extractionType === 'train-extraction') {
      reservationType = 'train';
      validator = validateTrainExtraction;
    } else if (extractionType === 'restaurant-extraction') {
      reservationType = 'restaurant';
      validator = validateRestaurantExtraction;
    } else if (extractionType === 'event-extraction') {
      reservationType = 'event';
      validator = validateEventExtraction;
    } else if (extractionType === 'cruise-extraction') {
      reservationType = 'cruise';
      validator = validateCruiseExtraction;
    } else if (extractionType === 'generic-reservation') {
      reservationType = 'generic';
      validator = validateGenericReservation;
    } else if (extractionType === 'private-driver-extraction') {
      reservationType = 'private-driver';
      validator = validatePrivateDriverExtraction;
    } else {
      reservationType = 'flight';
      validator = validateFlightExtraction;
    }
    
    console.log(`📋 Detected reservation type: ${reservationType}`);
    console.log(`🔌 Active plugins: ${activePlugins.join(', ')}`);
    console.log(`📊 Prompt stats: ${stats.totalLength} chars, ${stats.pluginCount} sections`);
    
    // Validate schema compatibility in development mode
    if (process.env.NODE_ENV === 'development') {
      const schemaValidation = validateOpenAISchema(
        schema, 
        `${reservationType}ExtractionSchema`
      );
      
      if (!schemaValidation.compatible) {
        console.error('❌ Schema compatibility errors:', schemaValidation.errors);
        console.warn('⚠️ Schema warnings:', schemaValidation.warnings);
      } else if (schemaValidation.warnings.length > 0) {
        console.warn('⚠️ Schema warnings:', schemaValidation.warnings);
      } else {
        console.log('✅ Schema is OpenAI compatible');
      }
    }

    // Log schema details before generation
    console.log('\n📋 Schema Details:');
    console.log('  - Extraction Type:', extractionType);
    console.log('  - Reservation Type:', reservationType);
    console.log('  - Validator:', validator.name);
    
    // Log the JSON Schema that will be sent to OpenAI
    try {
      const jsonSchema = zodToJsonSchema(schema, { target: 'openAi' });
      console.log('\n🔧 JSON Schema for OpenAI:');
      console.log(JSON.stringify(jsonSchema, null, 2));
      
      // Check required fields
      if (jsonSchema && typeof jsonSchema === 'object' && 'required' in jsonSchema) {
        console.log(`\n✅ Required fields count: ${(jsonSchema.required as string[]).length}`);
        console.log(`📝 Required fields: ${(jsonSchema.required as string[]).join(', ')}`);
      }
    } catch (error) {
      console.error('⚠️ Could not convert schema to JSON Schema:', error);
    }

    console.log(`\n🤖 Starting AI extraction with ${reservationType} schema...`);
    const startTime = Date.now();
    const result = await generateObject({
      model: openai("gpt-4o"),
      schema,
      prompt: `${prompt}\n\nEmail content:\n${emailText}`,
    });
    const duration = Date.now() - startTime;
    console.log(`⏱️ AI extraction completed in ${duration}ms`);

    // Log the AI response for debugging
    console.log('\n🔍 AI Response Object:', JSON.stringify(result.object, null, 2));
    console.log('📊 AI Response Type:', typeof result.object);
    console.log('📊 AI Response Keys:', Object.keys(result.object || {}).join(', '));

    // Validate the extracted data
    console.log('\n✅ Starting validation with validator:', validator.name);
    const validation = validator(result.object);
    
    if (!validation.success) {
      console.error('\n❌ Validation failed!');
      console.error('❌ Validation Details:');
      console.error('  - Success:', validation.success);
      console.error('  - Error:', JSON.stringify(validation.error, null, 2));
      
      // Try to parse the error to show specific field issues
      if (typeof validation.error === 'string') {
        console.error('  - Error Message:', validation.error);
      }
      
      return NextResponse.json(
        { 
          error: "Schema validation error - the AI response didn't match the expected format",
          details: validation.error,
          aiResponse: result.object,
          schemaType: reservationType,
        },
        { status: 500 }
      );
    }

    // Log success with type-specific message
    if (reservationType === 'hotel') {
      console.log(`✅ Successfully extracted hotel booking in ${duration}ms`);
    } else if (reservationType === 'car-rental') {
      console.log(`✅ Successfully extracted car rental booking in ${duration}ms`);
    } else if (reservationType === 'private-driver') {
      console.log(`✅ Successfully extracted private driver transfer in ${duration}ms`);
    } else if (reservationType === 'train') {
      console.log(`✅ Successfully extracted ${(validation.data as any).trains.length} train(s) in ${duration}ms`);
    } else if (reservationType === 'restaurant') {
      console.log(`✅ Successfully extracted restaurant reservation in ${duration}ms`);
    } else if (reservationType === 'event') {
      console.log(`✅ Successfully extracted event tickets in ${duration}ms`);
    } else if (reservationType === 'cruise') {
      console.log(`✅ Successfully extracted cruise booking in ${duration}ms`);
    } else if (reservationType === 'generic') {
      console.log(`✅ Successfully extracted generic reservation (${(validation.data as any).reservationType}) in ${duration}ms`);
    } else {
      console.log(`✅ Successfully extracted ${(validation.data as any).flights.length} flight(s) in ${duration}ms`);
    }

    // Log feedback if aiDetection data was provided (interactive approval flow)
    if (aiDetection && detectedType) {
      try {
        console.log('📝 Logging extraction feedback...');
        
        const feedbackResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/feedback/extraction-type`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('Cookie') || '' // Forward auth cookies
            },
            body: JSON.stringify({
              emailText,
              aiDetection,
              userSelection: {
                type: detectedType,
                category: handlerInfo.category
              },
              wasOverridden: userOverride,
              userFeedback
            })
          }
        );

        if (feedbackResponse.ok) {
          console.log('✅ Feedback logged successfully');
        } else {
          console.warn('⚠️  Failed to log feedback (non-critical)');
        }
      } catch (feedbackError) {
        // Don't fail the extraction if feedback logging fails
        console.warn('⚠️  Feedback logging failed (non-critical):', feedbackError);
      }
    }

    return NextResponse.json({
      success: true,
      type: reservationType,
      data: validation.data,
      usage: result.usage,
      metadata: {
        duration,
        ...(reservationType === 'flight' && { flightCount: (validation.data as any).flights.length }),
        ...(reservationType === 'car-rental' && { company: (validation.data as any).company }),
        ...(reservationType === 'private-driver' && { 
          company: (validation.data as any).company,
          driverName: (validation.data as any).driverName 
        }),
        ...(reservationType === 'train' && { trainCount: (validation.data as any).trains.length }),
        ...(reservationType === 'restaurant' && { restaurantName: (validation.data as any).restaurantName }),
        ...(reservationType === 'event' && { eventName: (validation.data as any).eventName }),
        ...(reservationType === 'cruise' && { cruiseLine: (validation.data as any).cruiseLine }),
        ...(reservationType === 'generic' && { 
          reservationType: (validation.data as any).reservationType,
          category: (validation.data as any).category 
        }),
      }
    });
  } catch (error: any) {
    console.error("❌ Email extraction error:", error);
    console.error("❌ Error details:", {
      message: error.message,
      name: error.name,
      cause: error.cause,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    
    // Provide helpful error messages based on error type
    if (error.message?.includes('required') || error.message?.includes('Missing')) {
      return NextResponse.json(
        { 
          error: "Schema validation error - the AI response didn't match the expected format",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          suggestion: "This might be due to an incompatible schema. Please contact support."
        },
        { status: 500 }
      );
    }
    
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { 
          error: "API configuration error",
          details: "OpenAI API key is missing or invalid"
        },
        { status: 500 }
      );
    }
    
    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          details: "Too many requests. Please try again in a moment."
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to extract travel information",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
