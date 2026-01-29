import { NextRequest, NextResponse } from 'next/server';
import { logClientMetrics } from '@/lib/utils/performance-tracker';
import { auth } from '@/auth';

// Rate limiting map (in-memory, simple implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await auth();
    const userId = session?.user?.id;

    // Rate limiting based on IP or user ID
    const identifier = userId || request.ip || 'anonymous';
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.pathname) {
      return NextResponse.json(
        { error: 'pathname is required' },
        { status: 400 }
      );
    }

    // Extract metrics
    const {
      pathname,
      sessionId,
      ttfb,
      fcp,
      lcp,
      cls,
      fid,
      inp,
    } = body;

    // Get user agent
    const userAgent = request.headers.get('user-agent') || undefined;

    // Log metrics
    await logClientMetrics({
      pathname,
      userId,
      sessionId,
      userAgent,
      ttfb: ttfb ? parseFloat(ttfb) : undefined,
      fcp: fcp ? parseFloat(fcp) : undefined,
      lcp: lcp ? parseFloat(lcp) : undefined,
      cls: cls ? parseFloat(cls) : undefined,
      fid: fid ? parseFloat(fid) : undefined,
      inp: inp ? parseFloat(inp) : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Performance API] Error logging metrics:', error);
    return NextResponse.json(
      { error: 'Failed to log metrics' },
      { status: 500 }
    );
  }
}
