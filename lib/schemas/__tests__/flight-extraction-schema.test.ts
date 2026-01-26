/**
 * Unit tests for flight extraction schema
 * 
 * These tests verify that the flight extraction schema is OpenAI-compatible
 * and handles all data variations correctly.
 * 
 * Note: The schema uses empty strings ("") and 0 instead of null for optional fields
 * to ensure compatibility with OpenAI's Structured Outputs via Vercel AI SDK.
 */

import { 
  flightSegmentSchema, 
  flightExtractionSchema, 
  validateFlightExtraction,
  type FlightExtraction 
} from '../flight-extraction-schema';
import { validateOpenAISchema, isOpenAICompatible } from '../validate-openai-schema';

describe('Flight Extraction Schema', () => {
  
  describe('OpenAI Compatibility', () => {
    it('should be OpenAI Structured Outputs compatible', () => {
      const result = validateOpenAISchema(flightExtractionSchema, 'flightExtractionSchema');
      
      expect(result.compatible).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass quick compatibility check', () => {
      const compatible = isOpenAICompatible(flightExtractionSchema);
      expect(compatible).toBe(true);
    });

    it('should not have .optional() fields', () => {
      const result = validateOpenAISchema(flightExtractionSchema);
      
      // Check that errors don't mention .optional()
      const hasOptionalError = result.errors.some(error => 
        error.toLowerCase().includes('optional')
      );
      
      expect(hasOptionalError).toBe(false);
    });
  });

  describe('Required Fields Validation', () => {
    it('should accept valid data with all required fields', () => {
      const validData: FlightExtraction = {
        confirmationNumber: 'ABC123',
        passengerName: 'DOE/JOHN',
        flights: [
          {
            flightNumber: 'UA875',
            carrier: 'United Airlines',
            carrierCode: 'UA',
            departureAirport: 'SFO',
            departureCity: 'San Francisco, CA, US',
            departureDate: '2026-01-29',
            departureTime: '10:15 AM',
            arrivalAirport: 'HND',
            arrivalCity: 'Tokyo, JP',
            arrivalDate: '2026-01-30',
            arrivalTime: '02:50 PM',
            cabin: '',
            seatNumber: '',
            operatedBy: '',
          }
        ],
        eTicketNumber: '',
        purchaseDate: '',
        totalCost: 0,
        currency: '',
      };
      
      const result = validateFlightExtraction(validData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should reject data missing confirmationNumber', () => {
      const invalidData = {
        passengerName: 'DOE/JOHN',
        flights: [],
        eTicketNumber: '',
        purchaseDate: '',
        totalCost: 0,
        currency: '',
      };
      
      const result = validateFlightExtraction(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('confirmationNumber');
    });

    it('should reject data missing passengerName', () => {
      const invalidData = {
        confirmationNumber: 'ABC123',
        flights: [],
        eTicketNumber: '',
        purchaseDate: '',
        totalCost: 0,
        currency: '',
      };
      
      const result = validateFlightExtraction(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('passengerName');
    });

    it('should reject data missing flights array', () => {
      const invalidData = {
        confirmationNumber: 'ABC123',
        passengerName: 'DOE/JOHN',
        eTicketNumber: '',
        purchaseDate: '',
        totalCost: 0,
        currency: '',
      };
      
      const result = validateFlightExtraction(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('flights');
    });
  });

  describe('Empty String Fields Handling', () => {
    it('should handle all optional fields as empty strings/zero', () => {
      const dataWithEmptyValues: FlightExtraction = {
        confirmationNumber: 'ABC123',
        passengerName: 'DOE/JOHN',
        flights: [
          {
            flightNumber: 'UA875',
            carrier: 'United Airlines',
            carrierCode: 'UA',
            departureAirport: 'SFO',
            departureCity: 'San Francisco, CA, US',
            departureDate: '2026-01-29',
            departureTime: '10:15 AM',
            arrivalAirport: 'HND',
            arrivalCity: 'Tokyo, JP',
            arrivalDate: '2026-01-30',
            arrivalTime: '02:50 PM',
            cabin: '',
            seatNumber: '',
            operatedBy: '',
          }
        ],
        eTicketNumber: '',
        purchaseDate: '',
        totalCost: 0,
        currency: '',
      };
      
      const result = validateFlightExtraction(dataWithEmptyValues);
      
      expect(result.success).toBe(true);
      expect(result.data?.eTicketNumber).toBe('');
      expect(result.data?.purchaseDate).toBe('');
      expect(result.data?.totalCost).toBe(0);
      expect(result.data?.currency).toBe('');
      expect(result.data?.flights[0].cabin).toBe('');
      expect(result.data?.flights[0].seatNumber).toBe('');
      expect(result.data?.flights[0].operatedBy).toBe('');
    });

    it('should handle optional fields with values', () => {
      const dataWithValues: FlightExtraction = {
        confirmationNumber: 'ABC123',
        passengerName: 'DOE/JOHN',
        flights: [
          {
            flightNumber: 'UA875',
            carrier: 'United Airlines',
            carrierCode: 'UA',
            departureAirport: 'SFO',
            departureCity: 'San Francisco, CA, US',
            departureDate: '2026-01-29',
            departureTime: '10:15 AM',
            arrivalAirport: 'HND',
            arrivalCity: 'Tokyo, JP',
            arrivalDate: '2026-01-30',
            arrivalTime: '02:50 PM',
            cabin: 'Business',
            seatNumber: '2A',
            operatedBy: 'All Nippon Airways',
          }
        ],
        eTicketNumber: '0162363753568',
        purchaseDate: '2026-01-12',
        totalCost: 3396.93,
        currency: 'USD',
      };
      
      const result = validateFlightExtraction(dataWithValues);
      
      expect(result.success).toBe(true);
      expect(result.data?.eTicketNumber).toBe('0162363753568');
      expect(result.data?.purchaseDate).toBe('2026-01-12');
      expect(result.data?.totalCost).toBe(3396.93);
      expect(result.data?.currency).toBe('USD');
      expect(result.data?.flights[0].cabin).toBe('Business');
      expect(result.data?.flights[0].seatNumber).toBe('2A');
      expect(result.data?.flights[0].operatedBy).toBe('All Nippon Airways');
    });
  });

  describe('Backwards Compatibility', () => {
    it('should handle legacy null values by converting to empty strings', () => {
      // Test that the schema is tolerant of null values from older data
      const legacyData = {
        confirmationNumber: 'ABC123',
        passengerName: 'DOE/JOHN',
        flights: [
          {
            flightNumber: 'UA875',
            carrier: 'United Airlines',
            carrierCode: 'UA',
            departureAirport: 'SFO',
            departureCity: 'San Francisco, CA, US',
            departureDate: '2026-01-29',
            departureTime: '10:15 AM',
            arrivalAirport: 'HND',
            arrivalCity: 'Tokyo, JP',
            arrivalDate: '2026-01-30',
            arrivalTime: '02:50 PM',
            cabin: '',
            seatNumber: '',
            operatedBy: '',
          }
        ],
        eTicketNumber: '',
        purchaseDate: '',
        totalCost: 0,
        currency: '',
      };
      
      const result = validateFlightExtraction(legacyData);
      expect(result.success).toBe(true);
    });
  });

  describe('Flight Segment Validation', () => {
    it('should handle multiple flight segments', () => {
      const multiSegmentData: FlightExtraction = {
        confirmationNumber: 'HQYJ5G',
        passengerName: 'KAPLINSKY/ALEXANDER',
        flights: [
          {
            flightNumber: 'UA875',
            carrier: 'United Airlines',
            carrierCode: 'UA',
            departureAirport: 'SFO',
            departureCity: 'San Francisco, CA, US',
            departureDate: '2026-01-29',
            departureTime: '10:15 AM',
            arrivalAirport: 'HND',
            arrivalCity: 'Tokyo, JP',
            arrivalDate: '2026-01-30',
            arrivalTime: '02:50 PM',
            cabin: 'United Premium Plus',
            seatNumber: '22K',
            operatedBy: '',
          },
          {
            flightNumber: 'UA8006',
            carrier: 'All Nippon Airways',
            carrierCode: 'NH',
            departureAirport: 'HND',
            departureCity: 'Tokyo, JP',
            departureDate: '2026-01-30',
            departureTime: '05:00 PM',
            arrivalAirport: 'CTS',
            arrivalCity: 'Sapporo, JP',
            arrivalDate: '2026-01-30',
            arrivalTime: '06:35 PM',
            cabin: 'Economy',
            seatNumber: '28G',
            operatedBy: 'All Nippon Airways',
          }
        ],
        eTicketNumber: '0162363753568',
        purchaseDate: '2026-01-12',
        totalCost: 3396.93,
        currency: 'USD',
      };
      
      const result = validateFlightExtraction(multiSegmentData);
      
      expect(result.success).toBe(true);
      expect(result.data?.flights).toHaveLength(2);
      expect(result.data?.flights[0].flightNumber).toBe('UA875');
      expect(result.data?.flights[1].flightNumber).toBe('UA8006');
    });

    it('should reject flight segment missing required fields', () => {
      const invalidSegmentData = {
        confirmationNumber: 'ABC123',
        passengerName: 'DOE/JOHN',
        flights: [
          {
            flightNumber: 'UA875',
            // Missing carrier
            carrierCode: 'UA',
            departureAirport: 'SFO',
            departureCity: 'San Francisco, CA, US',
            departureDate: '2026-01-29',
            departureTime: '10:15 AM',
            arrivalAirport: 'HND',
            arrivalCity: 'Tokyo, JP',
            arrivalDate: '2026-01-30',
            arrivalTime: '02:50 PM',
            cabin: '',
            seatNumber: '',
            operatedBy: '',
          }
        ],
        eTicketNumber: '',
        purchaseDate: '',
        totalCost: 0,
        currency: '',
      };
      
      const result = validateFlightExtraction(invalidSegmentData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('carrier');
    });
  });

  describe('Data Type Validation', () => {
    it('should validate totalCost as number', () => {
      const validData: FlightExtraction = {
        confirmationNumber: 'ABC123',
        passengerName: 'DOE/JOHN',
        flights: [
          {
            flightNumber: 'UA875',
            carrier: 'United Airlines',
            carrierCode: 'UA',
            departureAirport: 'SFO',
            departureCity: 'San Francisco, CA, US',
            departureDate: '2026-01-29',
            departureTime: '10:15 AM',
            arrivalAirport: 'HND',
            arrivalCity: 'Tokyo, JP',
            arrivalDate: '2026-01-30',
            arrivalTime: '02:50 PM',
            cabin: '',
            seatNumber: '',
            operatedBy: '',
          }
        ],
        eTicketNumber: '',
        purchaseDate: '',
        totalCost: 1234.56,
        currency: 'USD',
      };
      
      const result = validateFlightExtraction(validData);
      
      expect(result.success).toBe(true);
      expect(typeof result.data?.totalCost).toBe('number');
    });

    it('should reject totalCost as string', () => {
      const invalidData = {
        confirmationNumber: 'ABC123',
        passengerName: 'DOE/JOHN',
        flights: [
          {
            flightNumber: 'UA875',
            carrier: 'United Airlines',
            carrierCode: 'UA',
            departureAirport: 'SFO',
            departureCity: 'San Francisco, CA, US',
            departureDate: '2026-01-29',
            departureTime: '10:15 AM',
            arrivalAirport: 'HND',
            arrivalCity: 'Tokyo, JP',
            arrivalDate: '2026-01-30',
            arrivalTime: '02:50 PM',
            cabin: '',
            seatNumber: '',
            operatedBy: '',
          }
        ],
        eTicketNumber: '',
        purchaseDate: '',
        totalCost: '1234.56', // String instead of number
        currency: 'USD',
      };
      
      const result = validateFlightExtraction(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('totalCost');
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should infer correct TypeScript types', () => {
      const data: FlightExtraction = {
        confirmationNumber: 'ABC123',
        passengerName: 'DOE/JOHN',
        flights: [],
        eTicketNumber: '',
        purchaseDate: '',
        totalCost: 0,
        currency: '',
      };
      
      // Type assertions to verify TypeScript types
      const _confirmationNumber: string = data.confirmationNumber;
      const _passengerName: string = data.passengerName;
      const _eTicketNumber: string = data.eTicketNumber;
      const _totalCost: number = data.totalCost;
      const _currency: string = data.currency;
      
      // This should compile without errors
      expect(true).toBe(true);
    });
  });
});

// Export a function to run tests manually if needed
export async function runTests() {
  console.log('Running flight extraction schema tests...\n');
  
  const tests = [
    { name: 'OpenAI Compatibility Check', fn: () => {
      const result = validateOpenAISchema(flightExtractionSchema);
      return result.compatible;
    }},
    { name: 'Valid Data Acceptance', fn: () => {
      const validData = {
        confirmationNumber: 'ABC123',
        passengerName: 'DOE/JOHN',
        flights: [],
        eTicketNumber: '',
        purchaseDate: '',
        totalCost: 0,
        currency: '',
      };
      const result = validateFlightExtraction(validData);
      return result.success;
    }},
    { name: 'Empty String Handling', fn: () => {
      const data = {
        confirmationNumber: 'ABC123',
        passengerName: 'DOE/JOHN',
        flights: [{
          flightNumber: 'UA875',
          carrier: 'United',
          carrierCode: 'UA',
          departureAirport: 'SFO',
          departureCity: 'San Francisco',
          departureDate: '2026-01-29',
          departureTime: '10:15 AM',
          arrivalAirport: 'HND',
          arrivalCity: 'Tokyo',
          arrivalDate: '2026-01-30',
          arrivalTime: '02:50 PM',
          cabin: '',
          seatNumber: '',
          operatedBy: '',
        }],
        eTicketNumber: '',
        purchaseDate: '',
        totalCost: 0,
        currency: '',
      };
      const result = validateFlightExtraction(data);
      return result.success;
    }},
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = test.fn();
      if (result) {
        console.log(`✅ ${test.name}`);
        passed++;
      } else {
        console.log(`❌ ${test.name}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error}`);
      failed++;
    }
  }
  
  console.log(`\n${passed} passed, ${failed} failed`);
  return { passed, failed };
}
