/**
 * Test script for Amadeus Airport Search API
 * 
 * Purpose: Verify airport search works and returns expected airports
 * Test case: Search for airports near Palo Alto, CA
 * Expected results: SFO (San Francisco) and SJC (San Jose)
 * 
 * Usage: npx ts-node scripts/test-airport-search.ts
 */

import { searchAirports } from '../lib/amadeus/locations.js';

async function testAirportSearch() {
  console.log('='.repeat(60));
  console.log('AMADEUS AIRPORT SEARCH TEST');
  console.log('='.repeat(60));
  console.log('');

  // Test 1: Search by city name
  console.log('Test 1: Search "Palo Alto"');
  console.log('-'.repeat(60));
  try {
    const paloAltoResults = await searchAirports('Palo Alto', 10);
    console.log(`✅ Found ${paloAltoResults.length} airports`);
    
    paloAltoResults.forEach((airport: any, index: number) => {
      console.log(`\n${index + 1}. ${airport.name} (${airport.iataCode})`);
      console.log(`   City: ${airport.address?.cityName || 'N/A'}`);
      console.log(`   Country: ${airport.address?.countryName || 'N/A'}`);
      if (airport.geoCode) {
        console.log(`   Location: ${airport.geoCode.latitude}, ${airport.geoCode.longitude}`);
      }
    });

    // Check for expected airports
    const iataList = paloAltoResults.map((a: any) => a.iataCode);
    const hasSFO = iataList.includes('SFO');
    const hasSJC = iataList.includes('SJC');

    console.log('\n' + '-'.repeat(60));
    console.log('Expected Results Check:');
    console.log(`  SFO (San Francisco): ${hasSFO ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`  SJC (San Jose): ${hasSJC ? '✅ FOUND' : '❌ NOT FOUND'}`);

    if (hasSFO && hasSJC) {
      console.log('\n🎉 TEST PASSED: Both expected airports found!');
    } else {
      console.log('\n⚠️  TEST PARTIAL: Not all expected airports found');
    }
  } catch (error: any) {
    console.error('❌ Test 1 FAILED:', error.message);
    console.error('Error details:', error);
  }

  console.log('\n');

  // Test 2: Search by airport code
  console.log('Test 2: Search "SFO"');
  console.log('-'.repeat(60));
  try {
    const sfoResults = await searchAirports('SFO', 5);
    console.log(`✅ Found ${sfoResults.length} airports`);
    
    sfoResults.forEach((airport: any, index: number) => {
      console.log(`\n${index + 1}. ${airport.name} (${airport.iataCode})`);
      console.log(`   City: ${airport.address?.cityName || 'N/A'}`);
    });

    const hasSFO = sfoResults.some((a: any) => a.iataCode === 'SFO');
    console.log(`\nSFO found: ${hasSFO ? '✅ YES' : '❌ NO'}`);
  } catch (error: any) {
    console.error('❌ Test 2 FAILED:', error.message);
  }

  console.log('\n');

  // Test 3: Search "San Francisco"
  console.log('Test 3: Search "San Francisco"');
  console.log('-'.repeat(60));
  try {
    const sfResults = await searchAirports('San Francisco', 10);
    console.log(`✅ Found ${sfResults.length} airports`);
    
    sfResults.slice(0, 5).forEach((airport: any, index: number) => {
      console.log(`\n${index + 1}. ${airport.name} (${airport.iataCode})`);
      console.log(`   City: ${airport.address?.cityName || 'N/A'}`);
    });

    const hasSFO = sfResults.some((a: any) => a.iataCode === 'SFO');
    console.log(`\nSFO found: ${hasSFO ? '✅ YES' : '❌ NO'}`);
  } catch (error: any) {
    console.error('❌ Test 3 FAILED:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST SUITE COMPLETE');
  console.log('='.repeat(60));
}

// Run the test
testAirportSearch()
  .then(() => {
    console.log('\n✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
