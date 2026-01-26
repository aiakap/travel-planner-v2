import { NextResponse } from "next/server";

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
  apiStatus?: string;
  hint?: string;
}

export function createErrorResponse(
  error: ApiError,
  status: number = 500
): NextResponse {
  return NextResponse.json(
    {
      ...error,
      status: "error",
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export function createSuccessResponse(data: any): NextResponse {
  return NextResponse.json({
    ...data,
    status: "success",
    timestamp: new Date().toISOString(),
  });
}
