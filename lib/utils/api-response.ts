import { NextResponse } from 'next/server';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/lib/types/api';

/**
 * Creates a standardized success response envelope.
 * 
 * @param data - The data payload to return
 * @param status - HTTP status code (defaults to 200)
 * @returns NextResponse with success envelope
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Creates a standardized error response envelope.
 * 
 * @param message - Human-readable error message
 * @param code - Machine-readable error code for client handling
 * @param status - HTTP status code
 * @returns NextResponse with error envelope
 */
export function errorResponse(
  message: string,
  code: string,
  status: number
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
      },
    },
    { status }
  );
}
