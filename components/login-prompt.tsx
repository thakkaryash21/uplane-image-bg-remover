"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import LoginModal from "./login-modal";
import Button from "./button";

/**
 * Login prompt in header
 * Shows different states:
 * - Unauthenticated + first visit: Glowing "Sign in to save your work" button
 * - Unauthenticated + seen prompt: Simple "Sign in" button
 * - Authenticated: User info + sign out button
 */
export default function LoginPrompt() {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [hasSeenPrompt, setHasSeenPrompt] = useState(true); // Default to true (client-side check)

  useEffect(() => {
    // Check localStorage on mount (client-side only)
    const seen = localStorage.getItem("hasSeenLoginPrompt");
    setHasSeenPrompt(seen === "true");
  }, []);

  const handleLoginClick = () => {
    setShowModal(true);
    if (!hasSeenPrompt) {
      localStorage.setItem("hasSeenLoginPrompt", "true");
      setHasSeenPrompt(true);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Authenticated state
  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          {session.user.image && (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700"
            />
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {session.user.name || session.user.email}
          </span>
        </div>
        <Button variant="secondary" onClick={handleSignOut} className="!py-2">
          Sign out
        </Button>
      </div>
    );
  }

  // Unauthenticated state - first visit
  if (!hasSeenPrompt) {
    return (
      <>
        <Button
          variant="primary"
          onClick={handleLoginClick}
          className="login-prompt-glow !py-2 text-sm sm:text-base"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
          <span className="hidden sm:inline">Sign in to save your work</span>
          <span className="sm:hidden">Sign in</span>
        </Button>
        <LoginModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  // Unauthenticated state - prompt already seen
  return (
    <>
      <Button variant="secondary" onClick={handleLoginClick} className="!py-2">
        Sign in
      </Button>
      <LoginModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
