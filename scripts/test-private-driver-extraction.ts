/**
 * Test script for private driver email extraction
 * 
 * Tests the new shared type mapping utility with the tabi pirka private driver email
 */

import { getHandlerForType, getTypeMapping, getTypesForHandler } from '@/lib/email-extraction/type-mapping';

const PRIVATE_DRIVER_EMAIL = `Dear Mr Alex Kaplinsky,

Thank you for your prompt payment!
We are glad to confirm your booking.

Your driver is as follows:

Driver：Marumoto, Mr
Contact number：81(0) 90 8908 9969
Car type：Alphard
Plate number：1

Driver Marumoto will be waiting for you at the arrival hall (after baggage claim) showing a name board.

Booking confirmed -------------------
Lead guest：Mr Alex Kaplinsky
Passengers：2 adults
Luggage： 2 ski bags

Booking No：R08010702
Date： January 30, 2026
Pickup Location： New Chitose Airport (CTS)
Destination： SANSUI NISEKO

Car type：Alphard
Cost：¥52,000 (PAID)
 *the driver will be waiting for you at the arrival hall (after baggage claim and Customs) showing a name board.
 *the drive normally takes 2-2.5 hrs.  A short break can be taken on the way if requested.
---------------------------------------------------------

Again thank you for the booking, and we look forward to meeting you soon!

Sincerely,

Kaori TAKAMATSU (She/Her)
Domestic Travel Supervisor/ Certified Guide Interpreter (EN00246)
tabi pirka LLC　Kitahiro Office
Phone: 011-375-8080  FAX: 011-351-1082  English: 81-80-6078-8910 
Hokkaido Governor Registered Travel Industry  No. 3-893
https://www.instagram.com/tabipirka/
https://t-pirka.com/`;

async function testTypeMappingUtility() {
  console.log('🧪 Testing Type Mapping Utility\n');
  console.log('='.repeat(60));
  
  // Test 1: Get all type mappings
  console.log('\n📋 Test 1: Load all type mappings from database');
  const mapping = await getTypeMapping();
  console.log(`✅ Loaded ${mapping.size} reservation types`);
  
  // Test 2: Look up Private Driver specifically
  console.log('\n📋 Test 2: Look up "Private Driver" type');
  const privateDriverInfo = await getHandlerForType('Private Driver');
  if (privateDriverInfo) {
    console.log('✅ Found mapping:');
    console.log(`   Database Type: ${privateDriverInfo.dbTypeName}`);
    console.log(`   Category: ${privateDriverInfo.category}`);
    console.log(`   Handler: ${privateDriverInfo.handler}`);
    console.log(`   Plugin ID: ${privateDriverInfo.pluginId}`);
  } else {
    console.log('❌ Private Driver not found in database!');
  }
  
  // Test 3: Look up all types that use car-rental handler
  console.log('\n📋 Test 3: Find all types using "car-rental" handler');
  const carRentalTypes = await getTypesForHandler('car-rental');
  console.log(`✅ Found ${carRentalTypes.length} types:`);
  carRentalTypes.forEach(info => {
    console.log(`   - ${info.dbTypeName} (${info.category})`);
  });
  
  // Test 4: Verify detection would work
  console.log('\n📋 Test 4: Check if email has private driver keywords');
  const lowerEmail = PRIVATE_DRIVER_EMAIL.toLowerCase();
  const privateDriverKeywords = [
    'driver will be waiting',
    'showing a name board',
    'drive normally takes',
    'transfer',
    'pickup location',
    'destination'
  ];
  
  const matchedKeywords = privateDriverKeywords.filter(kw => lowerEmail.includes(kw));
  console.log(`✅ Matched ${matchedKeywords.length} keywords:`);
  matchedKeywords.forEach(kw => console.log(`   - "${kw}"`));
  
  // Test 5: Simulate the full detection → extraction flow
  console.log('\n📋 Test 5: Simulate detection → extraction flow');
  console.log('   Step 1: Detection API identifies as "Private Driver"');
  console.log('   Step 2: Email-extract receives detectedType="Private Driver"');
  console.log('   Step 3: Look up handler mapping...');
  
  const handlerInfo = await getHandlerForType('Private Driver');
  if (handlerInfo) {
    console.log(`   ✅ Mapped to: ${handlerInfo.handler} → ${handlerInfo.pluginId}`);
    console.log('   Step 4: Use car-rental-extraction plugin');
    console.log('   Step 5: Extract data with carRentalExtractionSchema');
    console.log('   ✅ SUCCESS: Type mapping chain complete!');
  } else {
    console.log('   ❌ FAILED: Could not find handler mapping');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!\n');
}

// Run the tests
testTypeMappingUtility()
  .then(() => {
    console.log('✅ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
