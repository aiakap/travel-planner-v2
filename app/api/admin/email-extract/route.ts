import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
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
  validateOpenAISchema 
} from "@/lib/schemas/validate-openai-schema";
import { buildExtractionPrompt } from "@/lib/email-extraction";

type ReservationType = "flight" | "hotel" | "car-rental" | "train" | "restaurant" | "event" | "cruise" | "generic";

export async function POST(request: NextRequest) {
  try {
    const { emailText } = await request.json();

    console.log(`📧 Email extraction request received, text length: ${emailText?.length || 0}`);

    if (!emailText) {
      console.error('❌ No email text provided');
      return NextResponse.json(
        { error: "Email text is required" },
        { status: 400 }
      );
    }

    // Build extraction prompt using plugin system
    console.log(`🔌 Building extraction prompt with plugin system...`);
    let extractionResult;
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

    console.log(`🤖 Starting AI extraction with ${reservationType} schema...`);
    const startTime = Date.now();
    const result = await generateObject({
      model: openai("gpt-4o"),
      schema,
      prompt: `${prompt}\n\nEmail content:\n${emailText}`,
    });
    const duration = Date.now() - startTime;
    console.log(`⏱️ AI extraction completed in ${duration}ms`);

    // Validate the extracted data
    const validation = validator(result.object);
    
    if (!validation.success) {
      console.error('❌ Validation failed for extracted data:', validation.error);
      return NextResponse.json(
        { 
          error: "Extracted data validation failed",
          details: validation.error,
        },
        { status: 500 }
      );
    }

    // Log success with type-specific message
    if (reservationType === 'hotel') {
      console.log(`✅ Successfully extracted hotel booking in ${duration}ms`);
    } else if (reservationType === 'car-rental') {
      console.log(`✅ Successfully extracted car rental booking in ${duration}ms`);
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

    return NextResponse.json({
      success: true,
      type: reservationType,
      data: validation.data,
      usage: result.usage,
      metadata: {
        duration,
        ...(reservationType === 'flight' && { flightCount: (validation.data as any).flights.length }),
        ...(reservationType === 'car-rental' && { company: (validation.data as any).company }),
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
