import { auth } from '@/auth';
import type { NextRequest } from 'next/server';
import { readGuestCookie } from './guest';

/**
 * User resolution result
 */
export interface ResolvedUser {
  userId: string;
  isGuest: boolean;
  guestUserId?: string; // Present if authenticated user also has a guest cookie (merge needed)
}

/**
 * Resolve the current user from NextAuth session or guest cookie
 * 
 * This utility checks authentication state in the following order:
 * 1. NextAuth session (authenticated user)
 * 2. Guest cookie (anonymous user)
 * 3. No authentication (null)
 * 
 * If both a session AND a guest cookie exist, it returns the authenticated
 * user ID along with the guest user ID in `guestUserId` field. The caller
 * should trigger a merge operation.
 * 
 * @param request - Next.js request object
 * @returns Resolved user info or null if unauthenticated
 */
export async function resolveUser(request: NextRequest): Promise<ResolvedUser | null> {
  // Check for NextAuth session
  const session = await auth();
  const guestUserId = await readGuestCookie(request);
  
  if (session?.user?.id) {
    // Authenticated user - check if they also have a guest cookie (merge case)
    if (guestUserId) {
      return {
        userId: session.user.id,
        isGuest: false,
        guestUserId, // Signal that merge is needed
      };
    }
    
    return {
      userId: session.user.id,
      isGuest: false,
    };
  }
  
  // No session - check for guest cookie
  if (guestUserId) {
    return {
      userId: guestUserId,
      isGuest: true,
    };
  }
  
  // No authentication at all
  return null;
}
