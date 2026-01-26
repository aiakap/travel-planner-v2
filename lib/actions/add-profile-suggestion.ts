"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { addItemToXml, createEmptyProfileXml, parseXmlToGraph } from "@/lib/profile-graph-xml";

interface ProfileSuggestion {
  type: "hobby" | "preference";
  category: string;
  value: string;
  hobbyId?: string | null;
  preferenceTypeId?: string | null;
  optionId?: string | null;
}

export async function addProfileSuggestion(suggestion: ProfileSuggestion) {
  console.log('🔵 addProfileSuggestion CALLED with:', suggestion);
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'add-profile-suggestion.ts:18',message:'addProfileSuggestion called',data:{suggestion},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H5'})}).catch(()=>{});
  // #endregion
  
  const session = await auth();
  
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'add-profile-suggestion.ts:24',message:'Auth check',data:{hasSession:!!session,userId:session?.user?.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  try {
    // Get existing graph data (XML)
    const profileGraph = await prisma.userProfileGraph.findUnique({
      where: { userId: session.user.id },
    });

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'add-profile-suggestion.ts:39',message:'Fetched profile graph',data:{hasGraph:!!profileGraph,xmlLength:profileGraph?.graphData?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion

    let xmlData = profileGraph?.graphData || createEmptyProfileXml();

    // Add item to XML using the profile-graph-xml utility
    // The subcategory is the suggestion type (hobby/preference)
    const updatedXml = addItemToXml(
      xmlData,
      suggestion.category,
      suggestion.type,
      suggestion.value,
      {
        addedAt: new Date().toISOString(),
      }
    );

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'add-profile-suggestion.ts:54',message:'XML updated',data:{updatedXmlLength:updatedXml?.length,xmlChanged:updatedXml!==xmlData},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion

    // Save back to database
    const upsertResult = await prisma.userProfileGraph.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        graphData: updatedXml,
      },
      update: {
        graphData: updatedXml,
      },
    });

    console.log('🟢 Database upsert COMPLETE:', {id: upsertResult.id, userId: upsertResult.userId});
    
    // Verify what's actually in the database
    const verifyRead = await prisma.userProfileGraph.findUnique({
      where: { userId: session.user.id }
    });

    console.log('🔍 VERIFICATION:', {
      upsertedId: upsertResult.id,
      verifiedId: verifyRead?.id,
      upsertedLength: upsertResult.graphData.length,
      verifiedLength: verifyRead?.graphData.length,
      match: upsertResult.graphData === verifyRead?.graphData,
      idsMatch: upsertResult.id === verifyRead?.id
    });

    // Check if there are multiple records
    const allRecords = await prisma.userProfileGraph.findMany({
      where: { userId: session.user.id }
    });

    console.log('📊 All records for user:', allRecords.map(r => ({
      id: r.id,
      xmlLength: r.graphData.length,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    })));

    // Fetch user for name
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    });

    // Parse XML to graph data for immediate UI update
    // Use the actual database result, not the local variable
    const graphData = parseXmlToGraph(
      upsertResult.graphData,
      session.user.id,
      user?.name || undefined
    );

    console.log('🔍 Using database result:', {
      upsertedLength: upsertResult.graphData.length,
      localLength: updatedXml.length,
      match: upsertResult.graphData === updatedXml
    });

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'add-profile-suggestion.ts:81',message:'Graph data parsed',data:{nodeCount:graphData?.nodes?.length,edgeCount:graphData?.edges?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion

    revalidatePath("/profile/graph", "page");
    revalidatePath("/object/profile_attribute", "page");
    revalidatePath("/", "layout");
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'add-profile-suggestion.ts:89',message:'Returning success',data:{success:true,hasGraphData:!!graphData,hasXmlData:!!upsertResult.graphData},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    
    return { 
      success: true, 
      message: "Added to profile graph",
      graphData,
      xmlData: upsertResult.graphData
    };
  } catch (error) {
    console.error('🔴 ERROR in addProfileSuggestion:', error);
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'add-profile-suggestion.ts:100',message:'ERROR in addProfileSuggestion',data:{error:error instanceof Error?error.message:String(error),stack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    console.error("Error adding to profile graph:", error);
    throw new Error("Failed to add suggestion to profile");
  }
}
