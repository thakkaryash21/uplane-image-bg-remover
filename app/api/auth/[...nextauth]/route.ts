import { handlers } from '@/auth';

/**
 * NextAuth v5 API route handler
 * 
 * Handles all authentication routes:
 * - GET/POST /api/auth/signin
 * - GET/POST /api/auth/signout
 * - GET/POST /api/auth/callback/:provider
 * - GET /api/auth/session
 * - GET /api/auth/csrf
 * - GET /api/auth/providers
 */
export const { GET, POST } = handlers;
