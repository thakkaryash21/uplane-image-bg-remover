"use client";

import LoginPrompt from "./login-prompt";
import { IconMenu } from "./icons";

interface HeaderProps {
  onToggleSidebar: () => void;
}

/**
 * App header with logo, hamburger menu (mobile), and login prompt
 */
export default function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="glass-header px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-3">
          {/* Hamburger (mobile only) */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle sidebar"
          >
            <IconMenu size="md" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/Logo.png"
              alt="Logo"
              className="h-8 w-auto object-contain"
            />
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-50">
                Image Processor
              </h1>
              <p className="hidden sm:block text-xs text-gray-600 dark:text-gray-400">
                Remove backgrounds and flip images
              </p>
            </div>
          </div>
        </div>

        {/* Right: Login Prompt */}
        <LoginPrompt />
      </div>
    </header>
  );
}
