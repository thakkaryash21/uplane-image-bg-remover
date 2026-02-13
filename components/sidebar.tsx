"use client";

import type { ProcessedImage } from "@/lib/types/image";
import ConversionListItem from "./conversion-list-item";
import Button from "./button";

interface SidebarProps {
  conversions: ProcessedImage[];
  selectedId: string | null;
  onSelectConversion: (id: string | null) => void;
  onDeleteClick: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Sidebar with conversion history
 * - "New Conversion" button at top
 * - List of past conversions (newest first)
 * - Empty state message
 * - Responsive: drawer on mobile, always visible on desktop
 */
export default function Sidebar({
  conversions,
  selectedId,
  onSelectConversion,
  onDeleteClick,
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Overlay (mobile only) */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside
        className={`
          sidebar
          fixed md:relative inset-y-0 left-0 z-40
          w-full max-w-[280px] md:w-[220px] lg:w-[280px]
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full p-4 gap-4">
          {/* New Conversion Button */}
          <Button
            variant="primary"
            onClick={() => {
              onSelectConversion(null);
              onClose(); // Close sidebar on mobile
            }}
            className="w-full"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Conversion
          </Button>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-800" />

          {/* Conversion List */}
          <div className="flex-1 overflow-y-auto -mx-2">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 mb-2">
              History
            </h2>

            {conversions.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No conversions yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                  Upload an image to get started
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversions.map((conversion) => (
                  <ConversionListItem
                    key={conversion.id}
                    conversion={conversion}
                    isActive={conversion.id === selectedId}
                    onClick={() => {
                      onSelectConversion(conversion.id);
                      onClose(); // Close sidebar on mobile
                    }}
                    onDeleteClick={onDeleteClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
