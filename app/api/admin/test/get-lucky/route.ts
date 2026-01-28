import { NextRequest } from 'next/server';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { expResponseSchema } from '@/lib/schemas/exp-response-schema';
import { buildGetLuckySystemPrompt, buildGetLuckyUserMessage, type TripGenerationParams } from '@/lib/ai/get-lucky-full-generation-prompt';
import { getActivityDensity } from '@/lib/utils/profile-helpers';

function sendDebugSSE(controller: ReadableStreamDefaultController, data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(message));
}

function validateSchemaStructure(schema: any): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for type
  if (!schema.type) {
    errors.push('Missing root type');
  } else if (schema.type !== 'object') {
    errors.push(`Root type must be 'object', got '${schema.type}'`);
  }
  
  // Check for unsupported features
  if (schema.oneOf) {
    errors.push('oneOf is not supported by OpenAI, use anyOf instead');
  }
  
  // Check for required fields
  if (!schema.properties) {
    errors.push('Missing properties');
  }
  
  // Check for additionalProperties
  if (schema.additionalProperties !== false) {
    warnings.push('additionalProperties should be false for strict mode');
  }
  
  // Deep check for nested oneOf
  function checkForOneOf(obj: any, path: string = 'root'): void {
    if (typeof obj !== 'object' || obj === null) return;
    
    if (obj.oneOf) {
      errors.push(`Found oneOf at ${path} - this is not supported by OpenAI`);
    }
    
    if (obj.properties) {
      Object.keys(obj.properties).forEach(key => {
        checkForOneOf(obj.properties[key], `${path}.properties.${key}`);
      });
    }
    
    if (obj.items) {
      checkForOneOf(obj.items, `${path}.items`);
    }
    
    if (obj.anyOf) {
      obj.anyOf.forEach((item: any, i: number) => {
        checkForOneOf(item, `${path}.anyOf[${i}]`);
      });
    }
  }
  
  checkForOneOf(schema);
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Stage 1: Log input parameters
        sendDebugSSE(controller, {
          stage: 'input',
          success: true,
          data: body,
          timestamp: new Date().toISOString(),
        });
        
        // Stage 2: Calculate trip parameters
        const startPromptBuild = Date.now();
        
        const startDate = body.startDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = body.endDate || new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const durationDays = Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const activityDensity = getActivityDensity(body.activityLevel || 'Moderate');
        
        const promptParams: TripGenerationParams = {
          destination: body.destination || 'Barcelona, Spain',
          startDate,
          endDate,
          durationDays,
          budgetLevel: body.budgetLevel || 'moderate',
          activityLevel: body.activityLevel || 'Moderate',
          activityDensity,
          accommodation: 'Hotel',
          travelPace: 'Balanced',
          travelers: 'solo traveler',
        };
        
        sendDebugSSE(controller, {
          stage: 'parameters',
          success: true,
          data: {
            promptParams,
            calculatedDays: durationDays,
            activityDensity,
          },
          timing: Date.now() - startPromptBuild,
        });
        
        // Stage 3: Build prompts
        const startPromptGeneration = Date.now();
        const systemPrompt = buildGetLuckySystemPrompt(promptParams);
        const userMessage = buildGetLuckyUserMessage(promptParams);
        
        sendDebugSSE(controller, {
          stage: 'prompt_building',
          success: true,
          data: {
            systemPromptLength: systemPrompt.length,
            userMessageLength: userMessage.length,
            systemPromptPreview: systemPrompt.substring(0, 500) + '...',
            systemPromptEnd: '...' + systemPrompt.substring(systemPrompt.length - 200),
            userMessage,
          },
          timing: Date.now() - startPromptGeneration,
        });
        
        // Stage 4: Convert schema
        const startSchemaConversion = Date.now();
        let convertedSchema;
        try {
          convertedSchema = zodToJsonSchema(expResponseSchema, { target: 'openAi' });
          
          sendDebugSSE(controller, {
            stage: 'schema_conversion',
            success: true,
            data: {
              schemaSize: JSON.stringify(convertedSchema).length,
              schemaType: convertedSchema.type,
              hasProperties: !!convertedSchema.properties,
              propertyKeys: convertedSchema.properties ? Object.keys(convertedSchema.properties) : [],
              required: convertedSchema.required || [],
              additionalProperties: convertedSchema.additionalProperties,
            },
            timing: Date.now() - startSchemaConversion,
          });
        } catch (error: any) {
          sendDebugSSE(controller, {
            stage: 'schema_conversion',
            success: false,
            error: error.message,
            data: { stack: error.stack },
            timing: Date.now() - startSchemaConversion,
          });
          throw error;
        }
        
        // Stage 5: Validate schema structure
        const startValidation = Date.now();
        const validation = validateSchemaStructure(convertedSchema);
        
        sendDebugSSE(controller, {
          stage: 'schema_validation',
          success: validation.valid,
          data: {
            valid: validation.valid,
            errors: validation.errors,
            warnings: validation.warnings,
            errorCount: validation.errors.length,
            warningCount: validation.warnings.length,
          },
          timing: Date.now() - startValidation,
        });
        
        if (!validation.valid) {
          sendDebugSSE(controller, {
            stage: 'validation_failed',
            success: false,
            error: `Schema validation failed: ${validation.errors.join(', ')}`,
            data: {
              fullSchema: convertedSchema,
              errors: validation.errors,
            },
          });
          throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
        }
        
        // Stage 6: Show full schema for inspection
        sendDebugSSE(controller, {
          stage: 'schema_full',
          success: true,
          data: {
            schema: convertedSchema,
            message: 'Full schema available for inspection',
          },
        });
        
        // Stage 7: Ready for OpenAI
        sendDebugSSE(controller, {
          stage: 'openai_ready',
          success: true,
          data: {
            message: 'Schema is valid and ready for OpenAI',
            model: 'gpt-4o-2024-08-06',
            temperature: 0.9,
            requestFormat: {
              type: 'json_schema',
              json_schema: {
                name: 'trip_generation',
                strict: true,
                schema: '(full schema would be sent here)',
              },
            },
            note: 'Test mode - OpenAI call not executed to save costs',
          },
        });
        
        // Stage 8: Summary
        sendDebugSSE(controller, {
          stage: 'complete',
          success: true,
          data: {
            message: 'All validation stages passed successfully',
            summary: {
              destination: promptParams.destination,
              duration: `${durationDays} days`,
              activityLevel: promptParams.activityLevel,
              budgetLevel: promptParams.budgetLevel,
              schemaValid: validation.valid,
              warnings: validation.warnings.length,
            },
          },
        });
        
        controller.close();
      } catch (error: any) {
        sendDebugSSE(controller, {
          stage: 'error',
          success: false,
          error: error.message,
          data: {
            stack: error.stack,
            name: error.name,
          },
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
}
