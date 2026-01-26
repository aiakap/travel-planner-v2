/**
 * Test Script for Profile CRUD Operations
 * 
 * Tests the specialized profile CRUD server actions directly
 * Run with: npx tsx scripts/test-profile-crud.ts
 */

import { upsertProfileItem, deleteProfileItem, readProfileData } from "@/lib/actions/profile-crud-actions";

async function testProfileCRUD() {
  console.log("\n🧪 Testing Profile CRUD operations...\n");
  
  try {
    // Test 1: Upsert
    console.log("1️⃣ Testing UPSERT...");
    const upsertResult = await upsertProfileItem({
      category: "Hobbies",
      subcategory: "hobby",
      value: "Test Triathlon",
      metadata: { source: "test-script", timestamp: new Date().toISOString() }
    });
    
    console.log("✅ Upsert result:", {
      success: upsertResult.success,
      nodeCount: upsertResult.graphData.nodes.length,
      edgeCount: upsertResult.graphData.edges.length
    });
    
    // Test 2: Read
    console.log("\n2️⃣ Testing READ...");
    const readResult = await readProfileData();
    console.log("✅ Read result:", {
      nodeCount: readResult.graphData.nodes.length,
      edgeCount: readResult.graphData.edges.length,
      hasTestItem: readResult.graphData.nodes.some((n: any) => n.value === "Test Triathlon")
    });
    
    // Test 3: Delete
    console.log("\n3️⃣ Testing DELETE...");
    const deleteResult = await deleteProfileItem({
      category: "Hobbies",
      subcategory: "hobby",
      value: "Test Triathlon"
    });
    
    console.log("✅ Delete result:", {
      success: deleteResult.success,
      nodeCount: deleteResult.graphData.nodes.length,
      edgeCount: deleteResult.graphData.edges.length,
      testItemRemoved: !deleteResult.graphData.nodes.some((n: any) => n.value === "Test Triathlon")
    });
    
    // Test 4: Verify deletion
    console.log("\n4️⃣ Verifying deletion...");
    const verifyResult = await readProfileData();
    const stillExists = verifyResult.graphData.nodes.some((n: any) => n.value === "Test Triathlon");
    
    if (stillExists) {
      console.error("❌ FAILED: Test item still exists after deletion");
    } else {
      console.log("✅ Verified: Test item successfully removed");
    }
    
    console.log("\n🎉 All tests completed successfully!\n");
    
  } catch (error) {
    console.error("\n❌ Test failed with error:", error);
    console.error("\nError details:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run tests
testProfileCRUD();
