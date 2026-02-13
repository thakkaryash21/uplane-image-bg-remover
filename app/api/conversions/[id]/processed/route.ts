import { NextRequest } from 'next/server';
import { serveImageProxy } from '@/lib/utils/image-proxy';

/**
 * GET /api/conversions/[id]/processed
 *
 * Processed image proxy route - serves the processed image through authentication.
 *
 * This route enforces authentication and ownership checks before serving
 * the processed image content. The actual Vercel Blob URL is never exposed to the
 * client - all image access goes through this authenticated proxy.
 *
 * Flow:
 * 1. Authenticate user (NextAuth session or guest cookie)
 * 2. Trigger merge if both session + guest cookie exist
 * 3. Query conversion record from DB
 * 4. Verify ownership (userId matches)
 * 5. Fetch processed blob content from Vercel Blob server-side
 * 6. Stream image bytes to client with appropriate headers
 *
 * Cache headers ensure browsers can cache locally but CDNs won't cache
 * authenticated content (Cache-Control: private).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return serveImageProxy(request, id, {
    getBlobUrl: (conversion) => conversion.processedBlobUrl,
    getContentType: (conversion) => conversion.processedContentType,
    getContentLength: (conversion) => conversion.size,
    errorContext: 'Error serving processed image file',
  });
}
