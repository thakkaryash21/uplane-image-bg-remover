import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/utils/api-response';
import { ConversionRepository } from '@/lib/services/conversion.repository';
import { VercelBlobStorageService } from '@/lib/services/storage/vercel-blob.service';
import { resolveUser } from '@/lib/auth/resolve-user';
import { mergeGuestUser } from '@/lib/auth/merge-guest';

/**
 * GET /api/images/[id]/file
 * 
 * Image proxy route - serves actual image bytes through authentication.
 * 
 * This route enforces authentication and ownership checks before serving
 * the image content. The actual Vercel Blob URL is never exposed to the
 * client - all image access goes through this authenticated proxy.
 * 
 * Flow:
 * 1. Authenticate user (NextAuth session or guest cookie)
 * 2. Trigger merge if both session + guest cookie exist
 * 3. Query conversion record from DB
 * 4. Verify ownership (userId matches)
 * 5. Fetch blob content from Vercel Blob server-side
 * 6. Stream image bytes to client with appropriate headers
 * 
 * Cache headers ensure browsers can cache locally but CDNs won't cache
 * authenticated content (Cache-Control: private).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    // Fetch blob content from storage
    const blobService = new VercelBlobStorageService();
    const imageBuffer = await blobService.fetchBlob(conversion.blobUrl);

    // Return image with appropriate headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': conversion.contentType,
        'Content-Length': conversion.size.toString(),
        // Cache locally but not on CDN (private content)
        'Cache-Control': 'private, max-age=3600',
        // Optional: Add filename for downloads
        'Content-Disposition': `inline; filename="${conversion.originalName}"`,
      },
    });
  } catch (error) {
    console.error('Error serving image file:', error);
    
    // Return JSON error response
    return errorResponse(
      'Failed to retrieve image file',
      'FILE_RETRIEVAL_ERROR',
      500
    );
  }
}
