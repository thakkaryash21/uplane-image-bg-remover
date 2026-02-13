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
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold border border-primary-200 dark:border-primary-800">
              {session.user.name?.[0] || "U"}
            </div>
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {session.user.name || session.user.email}
          </span>
        </div>
        <Button
          variant="secondary"
          onClick={handleSignOut}
          className="!py-2 gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="hidden sm:inline">Sign out</span>
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
          className="login-prompt-glow !py-2 text-sm sm:text-base gap-2"
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
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
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
      <Button
        variant="secondary"
        onClick={handleLoginClick}
        className="!py-2 gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
          />
        </svg>
        Sign in
      </Button>
      <LoginModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
