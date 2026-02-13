import { NextRequest, NextResponse } from 'next/server';
import { resolveUser } from '@/lib/auth/resolve-user';
import { conversionRepository } from '@/lib/services/conversion.repository';
import { errorResponse } from '@/lib/utils/api-response';
import { clearGuestCookie } from '@/lib/auth/guest';
import type { Conversion } from '@prisma/client';

/**
 * Successful authorization result
 */
interface AuthorizedResult {
  authorized: true;
  userId: string;
  conversion: Conversion;
  shouldClearGuestCookie: boolean;
}

/**
 * Failed authorization result with error response
 */
interface UnauthorizedResult {
  authorized: false;
  response: NextResponse;
}

export type AuthorizationResult = AuthorizedResult | UnauthorizedResult;

/**
 * Authorize access to a conversion (image)
 * 
 * This helper encapsulates the common authorization pattern used across
 * GET metadata, DELETE, and proxy routes:
 * 1. Resolve user (handles merge transparently if needed)
 * 2. Return 401 if no authentication
 * 3. Query conversion from database
 * 4. Return 404 if conversion not found
 * 5. Verify ownership (userId matches)
 * 6. Return 403 if ownership check fails
 * 
 * @param request - The incoming request
 * @param conversionId - The conversion/image ID to authorize
 * @returns Authorization result - either authorized with user+conversion, or unauthorized with error response
 */
export async function authorizeConversionAccess(
  request: NextRequest,
  conversionId: string
): Promise<AuthorizationResult> {
  // Validate ID
  if (!conversionId) {
    return {
      authorized: false,
      response: errorResponse('Image ID is required', 'ID_REQUIRED', 400),
    };
  }

  // Resolve user (handles merge transparently)
  const user = await resolveUser(request);

  // Require authentication
  if (!user) {
    return {
      authorized: false,
      response: errorResponse(
        'Authentication required',
        'UNAUTHORIZED',
        401
      ),
    };
  }

  // Query conversion from database
  const conversion = await conversionRepository.findById(conversionId);

  if (!conversion) {
    return {
      authorized: false,
      response: errorResponse('Image not found', 'NOT_FOUND', 404),
    };
  }

  // Verify ownership
  if (conversion.userId !== user.userId) {
    return {
      authorized: false,
      response: errorResponse(
        'You do not have permission to access this image',
        'FORBIDDEN',
        403
      ),
    };
  }

  // Successfully authorized
  return {
    authorized: true,
    userId: user.userId,
    conversion,
    shouldClearGuestCookie: user.shouldClearGuestCookie,
  };
}

/**
 * Helper to clear guest cookie on a response if needed
 * 
 * @param response - The response to potentially modify
 * @param shouldClear - Whether to clear the guest cookie
 * @returns The same response (potentially modified)
 */
export function maybeClearGuestCookie(
  response: NextResponse,
  shouldClear: boolean
): NextResponse {
  if (shouldClear) {
    clearGuestCookie(response);
  }
  return response;
}
