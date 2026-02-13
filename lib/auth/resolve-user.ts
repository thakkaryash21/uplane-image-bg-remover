import { auth } from '@/auth';
import type { NextRequest } from 'next/server';
import { readGuestCookie } from './guest';
import { mergeGuestUser } from './merge-guest';

/**
 * User resolution result
 */
export interface ResolvedUser {
  userId: string;
  isGuest: boolean;
  shouldClearGuestCookie: boolean;
}

/**
 * Resolve the current user from NextAuth session or guest cookie
 * 
 * This utility checks authentication state and handles guest-to-authenticated
 * merging transparently. The merge happens automatically when both a NextAuth
 * session and guest cookie exist (which occurs after explicit sign-in).
 * 
 * Resolution order:
 * 1. NextAuth session (authenticated user)
 *    - If guest cookie also exists: trigger merge, return authenticated user, signal cookie clear
 *    - If no guest cookie: return authenticated user
 * 2. Guest cookie (anonymous user)
 * 3. No authentication (null)
 * 
 * Callers receive a clean ResolvedUser without needing to know about merge mechanics.
 * 
 * @param request - Next.js request object
 * @returns Resolved user info with cookie clear signal, or null if unauthenticated
 */
export async function resolveUser(request: NextRequest): Promise<ResolvedUser | null> {
  const session = await auth();
  const guestUserId = await readGuestCookie(request);
  
  if (session?.user?.id) {
    // Authenticated user - check if they also have a guest cookie (merge case)
    if (guestUserId) {
      // Merge guest data into authenticated user transparently
      await mergeGuestUser(guestUserId, session.user.id);
      
      return {
        userId: session.user.id,
        isGuest: false,
        shouldClearGuestCookie: true, // Signal to caller that cookie should be cleared
      };
    }
    
    return {
      userId: session.user.id,
      isGuest: false,
      shouldClearGuestCookie: false,
    };
  }
  
  // No session - check for guest cookie
  if (guestUserId) {
    return {
      userId: guestUserId,
      isGuest: true,
      shouldClearGuestCookie: false,
    };
  }
  
  // No authentication at all
  return null;
}
