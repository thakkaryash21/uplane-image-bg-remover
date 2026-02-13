import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/utils/api-response';
import { ConversionRepository } from '@/lib/services/conversion.repository';
import { VercelBlobStorageService } from '@/lib/services/storage/vercel-blob.service';
import { resolveUser } from '@/lib/auth/resolve-user';
import { mergeGuestUser } from '@/lib/auth/merge-guest';
import type { Conversion } from '@prisma/client';

/**
 * Configuration for serving an image through the authenticated proxy
 */
interface ImageProxyConfig {
  /** Function to extract the blob URL from the conversion record */
  getBlobUrl: (conversion: Conversion) => string;
  /** Function to extract the content type from the conversion record */
  getContentType: (conversion: Conversion) => string;
  /** Function to calculate content length (from conversion or buffer) */
  getContentLength: (conversion: Conversion, buffer: Buffer) => number;
  /** Error message prefix for logging */
  errorContext: string;
}

/**
 * Shared authenticated image proxy handler
 * 
 * This function encapsulates the common logic for serving images through an authenticated proxy:
 * 1. Authenticate user (NextAuth session or guest cookie)
 * 2. Trigger merge if both session + guest cookie exist
 * 3. Query conversion record from DB
 * 4. Verify ownership (userId matches)
 * 5. Fetch blob content from Vercel Blob server-side
 * 6. Stream image bytes to client with appropriate headers
 * 
 * @param request - The incoming request
 * @param id - The conversion/image ID
 * @param config - Configuration specifying which blob to serve and how
 * @returns NextResponse with image data or error
 */
export async function serveImageProxy(
  request: NextRequest,
  id: string,
  config: ImageProxyConfig
): Promise<NextResponse> {
  try {
    if (!id) {
      return errorResponse(
        'Image ID is required',
        'ID_REQUIRED',
        400
      );
    }

    // Resolve user authentication
    let user = await resolveUser(request);
    
    // Handle merge if authenticated user has a guest cookie
    if (user?.guestUserId) {
      await mergeGuestUser(user.guestUserId, user.userId);
      user = { userId: user.userId, isGuest: false };
    }
    
    // Require authentication
    if (!user) {
      return errorResponse(
        'Authentication required to access image',
        'UNAUTHORIZED',
        401
      );
    }

    // Query conversion from database
    const conversionRepo = new ConversionRepository();
    const conversion = await conversionRepo.findById(id);

    if (!conversion) {
      return errorResponse(
        'Image not found',
        'NOT_FOUND',
        404
      );
    }

    // Verify ownership
    if (conversion.userId !== user.userId) {
      return errorResponse(
        'You do not have permission to access this image',
        'FORBIDDEN',
        403
      );
    }

    // Fetch blob content from storage using config
    const blobService = new VercelBlobStorageService();
    const blobUrl = config.getBlobUrl(conversion);
    const imageBuffer = await blobService.fetchBlob(blobUrl);

    // Return image with appropriate headers
    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        'Content-Type': config.getContentType(conversion),
        'Content-Length': config.getContentLength(conversion, imageBuffer).toString(),
        // Cache locally but not on CDN (private content)
        'Cache-Control': 'private, max-age=3600',
        // Optional: Add filename for downloads
        'Content-Disposition': `inline; filename="${conversion.originalName}"`,
      },
    });
  } catch (error) {
    console.error(`${config.errorContext}:`, error);
    
    // Return JSON error response
    return errorResponse(
      'Failed to retrieve image file',
      'FILE_RETRIEVAL_ERROR',
      500
    );
  }
}
