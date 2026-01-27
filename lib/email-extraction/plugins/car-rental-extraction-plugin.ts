/**
 * Car Rental Extraction Plugin
 * 
 * Extracts car rental booking information from confirmation emails
 */

import { ExtractionPlugin } from '../types';
import { carRentalExtractionSchema } from '@/lib/schemas/car-rental-extraction-schema';

export const CAR_RENTAL_EXTRACTION_PROMPT = `## Car Rental Booking Extraction

Extract car rental booking information from the confirmation email.

### Required Information

- **Confirmation Number**: Reservation or confirmation number
- **Guest Name**: Name of the person who made the reservation
- **Company**: Car rental company name (e.g., Toyota Rent a Car, Hertz, Enterprise, Avis, Budget)
- **Vehicle Class**: Vehicle class or category (e.g., Economy, Compact, SUV, 4WD) or empty string
- **Vehicle Model**: Specific vehicle model or similar options (e.g., Toyota Camry or similar) or empty string
- **Pickup Location**: Name of pickup location (e.g., Airport Terminal, Downtown Office)
- **Pickup Address**: Full address of pickup location or empty string if not provided
- **Pickup Date**: Date of pickup in ISO format (YYYY-MM-DD)
- **Pickup Time**: Time of pickup (e.g., "2:00 PM", "14:00") or empty string
- **Pickup Flight Number**: Arrival flight number if pickup is at airport (e.g., "NH215", "UA123") or empty string
- **Return Location**: Name of return/drop-off location
- **Return Address**: Full address of return location or empty string if not provided
- **Return Date**: Date of return in ISO format (YYYY-MM-DD)
- **Return Time**: Time of return (e.g., "11:00 AM", "11:00") or empty string
- **Total Cost**: Total estimated cost as a number or 0 if not found
- **Currency**: Currency code (e.g., "USD", "EUR", "JPY") or empty string
- **Options**: Array of options/accessories included (e.g., ["GPS", "Winter Tires", "Child Seat"]) or empty array
- **One-way Charge**: Additional charge for one-way rentals as a number or 0 if round-trip
- **Booking Date**: Date when the booking was made (ISO format) or empty string

### Common Email Patterns

- Major rental companies: Hertz, Enterprise, Avis, Budget, National, Alamo, Sixt, Thrifty, Dollar, Europcar, Toyota Rent a Car
- Look for phrases like "Reservation Confirmation", "Booking Number", "Pick-up", "Drop-off", "Return"
- Vehicle information often in separate section with class and model details
- Options/accessories listed as add-ons or included features
- Airport rentals often include terminal and flight information

### Extraction Tips

- Parse dates carefully - they may be in various formats (Jan 30, 2026 / January 30, 2026 / Fri, Jan 30)
- Pickup/return times may be in 12-hour (2:00 PM) or 24-hour (14:00) format
- Vehicle class and model may be listed separately or combined
- Options/accessories can include: GPS/Navigation, Winter Tires, Child Seat, Ski Rack, Snow Chains, ETC Card, Additional Driver, Insurance packages
- One-way rentals have different pickup and return locations with additional charges
- Round-trip rentals have same pickup and return location (one-way charge = 0)
- Airport pickups may include shuttle bus information and terminal details
- Guest name may be formatted as "LASTNAME/FIRSTNAME" or "First Last"
- Total cost may include breakdown of base rate, taxes, fees, and options
- Look for currency symbols (¥, $, €, £) or currency codes to determine currency`;

export const carRentalExtractionPlugin: ExtractionPlugin = {
  id: 'car-rental-extraction',
  name: 'Car Rental Booking Extraction',
  content: CAR_RENTAL_EXTRACTION_PROMPT,
  schema: carRentalExtractionSchema,
  priority: 10,
  shouldInclude: (context) => {
    const carRentalKeywords = [
      'car rental', 'rent a car', 'rental car', 'vehicle rental',
      'pick-up', 'pickup', 'drop-off', 'return location',
      'hertz', 'enterprise', 'avis', 'budget', 'toyota rent',
      'sixt', 'alamo', 'national', 'thrifty', 'europcar', 'dollar',
      'reservation number', 'rental agreement', 'vehicle class',
      'rental confirmation', 'car hire'
    ];
    
    const lowerText = context.emailText.toLowerCase();
    const carRentalScore = carRentalKeywords.filter(kw => lowerText.includes(kw)).length;
    
    // Activate if at least 3 car rental keywords are present
    return carRentalScore >= 3;
  }
};
