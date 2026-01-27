/**
 * Private Driver / Transfer Extraction Plugin
 * 
 * Extracts private driver and airport transfer booking information from confirmation emails.
 * 
 * This plugin is specifically for pre-booked private car services with assigned drivers,
 * NOT for on-demand taxis or ride-sharing services.
 */

import { ExtractionPlugin } from '../../types';
import { privateDriverExtractionSchema } from '@/lib/schemas/extraction/travel/private-driver-extraction-schema';

export const PRIVATE_DRIVER_EXTRACTION_PROMPT = `## Private Driver / Transfer Extraction

Extract private driver or airport transfer booking information from the confirmation email.

### CRITICAL INSTRUCTIONS FOR MISSING DATA

**IMPORTANT**: You MUST provide a value for every field in the schema:
- For any string field not found in the email, return an empty string ""
- For numeric fields not found, return 0
- For boolean fields, return false if not mentioned
- DO NOT skip fields, use null, or use undefined
- ALL fields must be present in your response

### Required Information

- **Confirmation Number**: Booking reference, order number, or reservation code
- **Guest Name**: Name of the passenger(s) who made the booking
- **Driver Name**: Name of the assigned driver (e.g., "Marumoto, Mr")
- **Driver Phone**: Contact phone number for the driver
- **Vehicle Type**: Type or model of vehicle (e.g., "Alphard", "Mercedes S-Class", "SUV")
- **Plate Number**: Vehicle license plate number (if provided, otherwise empty string)
- **Company**: Transfer company or service provider name
- **Pickup Location**: Where the passenger will be picked up (e.g., "New Chitose Airport (CTS)")
- **Pickup Address**: Full address if provided, otherwise empty string
- **Pickup Date**: Date of pickup in ISO format (YYYY-MM-DD)
- **Pickup Time**: Time of pickup (e.g., "14:00" or "2:00 PM"), or empty string if not specified
- **Pickup Instructions**: Specific meeting point details (e.g., "arrival hall after baggage claim")
- **Dropoff Location**: Final destination (e.g., "SANSUI NISEKO", hotel name)
- **Dropoff Address**: Full dropoff address if provided, otherwise empty string
- **Transfer Duration**: Estimated drive time (e.g., "2-2.5 hours"), or empty string
- **Waiting Instructions**: How driver will identify passenger (e.g., "showing a name board", "holding sign")
- **Passenger Count**: Number of passengers (default: 1 if not specified)
- **Luggage Details**: Description of luggage (e.g., "2 ski bags", "3 suitcases"), or empty string
- **Meet and Greet**: Boolean - whether meet and greet service is included (true/false)
- **Special Requests**: Any special requirements (e.g., "child seat", "wheelchair accessible"), or empty string
- **Cost**: Total cost as a number, or 0 if not provided
- **Currency**: Currency code (e.g., "JPY", "USD", "EUR"), or empty string

### Common Email Patterns

Private driver and transfer confirmations typically include:
- **Driver details**: Name, phone number, vehicle information
- **Meeting instructions**: "Driver will be waiting at arrival hall", "showing a name board"
- **Vehicle details**: Make/model, plate number, vehicle type
- **Transfer duration**: "The drive normally takes 2-2.5 hours"
- **Pickup/dropoff specifics**: Terminal numbers, hotel names, addresses
- **Luggage details**: Number of bags, ski equipment, oversized items
- **Payment status**: "PAID", payment confirmation

### Company Examples

Common private driver/transfer services:
- Airport shuttle companies (tabi pirka, Niseko Transfer)
- Luxury transfer services (Blacklane, Welcome Pickups)
- Hotel transfer services
- Local transfer companies
- Tour operator transfers

### Extraction Tips

- **Driver identification**: Look for "Driver:", "Your driver:", "Driver will be:"
- **Meeting instructions**: "showing a name board", "holding a sign", "meet and greet", "arrival hall"
- **Vehicle details**: Often listed as "Car type:", "Vehicle:", or mentioned with the driver
- **Plate number**: May be listed separately or with vehicle details
- **Transfer duration**: Look for "drive takes", "journey time", "transfer duration"
- **Pickup location specifics**: Terminal numbers, gate numbers, arrival hall details
- **Luggage**: "passengers", "luggage", "bags", "ski equipment"
- **Payment**: "PAID", "prepaid", "payment confirmed", or cost breakdown
- **Date format**: May be written as "January 30, 2026", "Jan 30", or "2026-01-30"
- **Time format**: Can be 12-hour ("2:00 PM") or 24-hour ("14:00")

### Distinguishing from Other Types

**Private Driver vs Taxi**:
- Private driver: Pre-booked, driver assigned, has confirmation number, shows both pickup AND dropoff
- Taxi: On-demand, no driver assigned, may only show pickup location

**Private Driver vs Ride Share**:
- Private driver: Professional transfer service, often luxury vehicles, advance booking
- Ride share: App-based (Uber/Lyft), consumer-grade vehicles, can be scheduled or on-demand

**Private Driver vs Car Rental**:
- Private driver: You are a passenger, driver provided, no vehicle return
- Car rental: You drive yourself, vehicle must be returned, rental agreement

### Example Email Indicators

Strong indicators this is a private driver booking:
1. "Your driver is as follows:"
2. "Driver will be waiting for you"
3. "showing a name board" / "holding a sign"
4. "meet and greet service"
5. "transfer service"
6. "airport pickup"
7. Specific driver name and phone number provided
8. Vehicle plate number provided
9. Both pickup AND dropoff locations specified
10. Transfer duration mentioned`;

export const privateDriverExtractionPlugin: ExtractionPlugin = {
  id: 'private-driver-extraction',
  name: 'Private Driver / Transfer Extraction',
  content: PRIVATE_DRIVER_EXTRACTION_PROMPT,
  schema: privateDriverExtractionSchema,
  priority: 10,
  shouldInclude: (context) => {
    const privateDriverKeywords = [
      // Driver-specific terms
      'private driver', 'private transfer', 'transfer service',
      'driver will be waiting', 'driver will meet', 'your driver',
      'assigned driver', 'driver:', 'driver is as follows',
      
      // Meeting/pickup terms
      'airport pickup', 'airport transfer', 'meet and greet',
      'showing a name board', 'holding a sign', 'name board',
      'arrival hall', 'baggage claim', 'customs',
      
      // Service terms
      'chauffeur', 'private car service', 'transfer company',
      'shuttle service', 'transportation service',
      
      // Booking specifics
      'vehicle type:', 'car type:', 'plate number',
      'drive normally takes', 'drive takes', 'transfer duration',
      'pickup location', 'destination:', 'dropoff'
    ];
    
    const lowerText = context.emailText.toLowerCase();
    const matchedKeywords = privateDriverKeywords.filter(kw => lowerText.includes(kw));
    const score = matchedKeywords.length;
    
    // Need at least 3 private driver-specific keywords to activate this plugin
    // This ensures we don't confuse with car rentals or taxis
    return score >= 3;
  }
};
