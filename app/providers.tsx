"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers wrapper
 * Wraps the app in NextAuth SessionProvider for client auth state access
 */
export default function Providers({ children }: ProvidersProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
