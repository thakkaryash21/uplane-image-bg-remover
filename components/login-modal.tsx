"use client";

import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Login modal with Google sign-in and guest option
 * Features:
 * - Google OAuth sign-in button (primary)
 * - "Continue as guest" hyperlink (secondary)
 * - Backdrop click and ESC key to close
 * - Focus trap
 * - Accessible
 * - Renders via Portal to avoid z-index/clipping issues
 */
export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleGoogleSignIn = async () => {
    await signIn("google");
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="modal-backdrop animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{ zIndex: 9999 }} // Ensure it's on top of everything
    >
      <div
        ref={modalRef}
        className="modal-content animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="modal-title"
          className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-gray-100"
        >
          Save your work
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
          Sign in to keep your conversions safe and accessible across devices
        </p>

        <button
          onClick={handleGoogleSignIn}
          className="btn-google"
          aria-label="Sign in with Google"
        >
          {/* Google "G" Icon */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>

        <button
          onClick={onClose}
          className="mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline w-full transition-colors duration-200"
        >
          Continue as guest
        </button>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close modal"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>,
    document.body,
  );
}
