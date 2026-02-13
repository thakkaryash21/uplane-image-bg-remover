import { auth } from '@/auth';

/**
 * Next.js 16 proxy configuration using NextAuth v5
 * 
 * This proxy runs on edge runtime and validates session tokens
 * on protected paths. It does NOT perform database operations.
 * 
 * The primary purpose is to ensure valid NextAuth sessions exist
 * before requests reach API routes. Guest user handling is done
 * at the route level via the resolveUser() utility.
 */
export default auth((req) => {
  // Auth middleware validates JWT session tokens automatically
  // No custom logic needed here - routes handle guest/auth logic
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
