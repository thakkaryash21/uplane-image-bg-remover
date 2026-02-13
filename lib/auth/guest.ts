import { SignJWT, jwtVerify } from 'jose';
import { randomUUID } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const GUEST_COOKIE_NAME = 'guest_token';
const GUEST_TOKEN_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Guest cookie mechanism for anonymous users
 * 
 * Creates signed JWTs containing guest user IDs to maintain
 * anonymous sessions before authentication. Signed with AUTH_SECRET
 * to prevent tampering.
 */

/**
 * Create a new guest user in the database and generate cookie token
 * 
 * This function handles the complete guest user creation flow:
 * 1. Generate a UUID for the guest user
 * 2. Create guest user record in database
 * 3. Generate signed JWT cookie token
 * 
 * @returns Object containing the guest user ID and signed token
 */
export async function createGuestUser(): Promise<{ userId: string; token: string }> {
  const guestUserId = randomUUID();
  
  // Create guest user in database
  await prisma.user.create({
    data: {
      id: guestUserId,
      isGuest: true,
    },
  });
  
  // Generate signed JWT token
  const token = await createGuestCookie(guestUserId);
  
  return { userId: guestUserId, token };
}

/**
 * Create a signed JWT guest cookie value
 * 
 * @param userId - Guest user UUID
 * @returns Signed JWT token string
 */
export async function createGuestCookie(userId: string): Promise<string> {
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
  
  const token = await new SignJWT({ sub: userId, isGuest: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1y')
    .sign(secret);
  
  return token;
}

/**
 * Read and verify a guest cookie from a request
 * 
 * @param request - NextRequest containing cookies
 * @returns Guest user ID if valid, null if missing or invalid
 */
export async function readGuestCookie(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(GUEST_COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    
    // Verify it's actually a guest token and has a valid userId
    if (payload.isGuest && typeof payload.sub === 'string') {
      return payload.sub;
    }
    
    return null;
  } catch (error) {
    // Token expired, invalid signature, or malformed
    console.warn('Invalid guest token:', error);
    return null;
  }
}

/**
 * Clear the guest cookie from a response
 * 
 * @param response - NextResponse to modify
 */
export function clearGuestCookie(response: NextResponse): void {
  response.cookies.set(GUEST_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    path: '/',
  });
}

/**
 * Set the guest cookie on a response
 * 
 * @param response - NextResponse to modify
 * @param token - Signed JWT guest token
 */
export function setGuestCookie(response: NextResponse, token: string): void {
  response.cookies.set(GUEST_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: GUEST_TOKEN_MAX_AGE,
    path: '/',
  });
}
