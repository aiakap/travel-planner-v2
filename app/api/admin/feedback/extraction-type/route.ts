import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import crypto from "crypto";

/**
 * Extraction Type Feedback API
 * 
 * Logs user feedback when they approve or override the AI's type detection.
 * This creates a learning dataset for improving detection over time.
 * 
 * Data logged:
 * - Original email text
 * - AI's detection (type, confidence, scoring breakdown)
 * - User's selection (type they chose)
 * - Whether user overrode AI
 * - Reason for override (if provided)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      emailText,
      aiDetection,
      userSelection,
      wasOverridden,
      userFeedback
    } = await request.json();

    // Validate required fields
    if (!emailText || !aiDetection || !userSelection) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create hash for deduplication
    const emailHash = crypto.createHash('sha256').update(emailText).digest('hex');

    console.log('📝 Logging extraction feedback:', {
      emailLength: emailText.length,
      aiType: aiDetection.topMatch?.type || aiDetection.detectedType,
      userType: userSelection.type,
      wasOverridden
    });

    // Check if we already have feedback for this exact email
    const existing = await prisma.extractionFeedback.findUnique({
      where: { emailHash }
    });

    if (existing) {
      console.log('⚠️  Feedback already exists for this email (hash: ' + emailHash.slice(0, 8) + '...)');
      
      // Update existing feedback if user changed their mind
      const updated = await prisma.extractionFeedback.update({
        where: { emailHash },
        data: {
          userSelectedType: userSelection.type,
          userCategory: userSelection.category,
          wasOverridden,
          userReason: userFeedback || existing.userReason,
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        id: updated.id,
        updated: true 
      });
    }

    // Create new feedback entry
    const feedback = await prisma.extractionFeedback.create({
      data: {
        emailText,
        emailHash,
        emailLength: emailText.length,
        
        // AI Detection data
        aiTopType: aiDetection.topMatch?.type || aiDetection.detectedType || 'Unknown',
        aiCategory: aiDetection.topMatch?.category || aiDetection.category || 'Unknown',
        aiConfidence: aiDetection.topMatch?.confidence || aiDetection.confidence || 0,
        aiScore: aiDetection.topMatch?.score || 0,
        aiScoring: aiDetection.scoringBreakdown || {},
        aiAlternatives: aiDetection.alternativeTypes || [],
        
        // User Decision data
        userSelectedType: userSelection.type,
        userCategory: userSelection.category,
        wasOverridden,
        userReason: userFeedback || null,
        
        userId: session.user.id,
        
        // Learning flags (default to false, can be updated later)
        reviewed: false,
        incorporated: false
      }
    });

    console.log('✅ Extraction feedback logged:', {
      id: feedback.id,
      wasOverridden,
      aiType: feedback.aiTopType,
      userType: feedback.userSelectedType
    });

    // Log to console for immediate visibility
    if (wasOverridden) {
      console.log('🔄 TYPE OVERRIDE DETECTED:');
      console.log(`   AI predicted: ${feedback.aiTopType} (${Math.round(feedback.aiConfidence * 100)}%)`);
      console.log(`   User selected: ${feedback.userSelectedType}`);
      if (userFeedback) {
        console.log(`   Reason: ${userFeedback}`);
      }
    } else {
      console.log('✅ USER APPROVED AI SELECTION:');
      console.log(`   Type: ${feedback.userSelectedType} (${Math.round(feedback.aiConfidence * 100)}% confidence)`);
    }

    return NextResponse.json({ 
      success: true, 
      id: feedback.id,
      updated: false
    });

  } catch (error: any) {
    console.error("❌ Feedback logging error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to log feedback",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve feedback statistics
 * 
 * Useful for analytics and reviewing AI performance
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get statistics
    const totalFeedback = await prisma.extractionFeedback.count();
    const overriddenCount = await prisma.extractionFeedback.count({
      where: { wasOverridden: true }
    });
    const approvedCount = totalFeedback - overriddenCount;
    
    // Get most common override patterns
    const overrides = await prisma.extractionFeedback.findMany({
      where: { wasOverridden: true },
      select: {
        aiTopType: true,
        userSelectedType: true,
        userReason: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Group by AI type -> User type
    const overridePatterns: Record<string, Record<string, number>> = {};
    overrides.forEach(o => {
      if (!overridePatterns[o.aiTopType]) {
        overridePatterns[o.aiTopType] = {};
      }
      overridePatterns[o.aiTopType][o.userSelectedType] = 
        (overridePatterns[o.aiTopType][o.userSelectedType] || 0) + 1;
    });

    return NextResponse.json({
      statistics: {
        total: totalFeedback,
        approved: approvedCount,
        overridden: overriddenCount,
        accuracyRate: totalFeedback > 0 
          ? ((approvedCount / totalFeedback) * 100).toFixed(1) + '%'
          : 'N/A'
      },
      overridePatterns,
      recentOverrides: overrides.slice(0, 10)
    });

  } catch (error: any) {
    console.error("❌ Feedback stats error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get feedback stats" },
      { status: 500 }
    );
  }
}
