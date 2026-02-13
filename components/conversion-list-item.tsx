"use client";

import type { ProcessedImage } from "@/lib/types/image";

// Simple relative time formatter (avoids adding date-fns dependency)
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

interface ConversionListItemProps {
  conversion: ProcessedImage;
  isActive: boolean;
  onClick: () => void;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Sidebar list item for a past conversion
 * Shows thumbnail, filename, relative time, and delete button
 */
export default function ConversionListItem({
  conversion,
  isActive,
  onClick,
  onDelete,
}: ConversionListItemProps) {
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger onClick

    if (confirm("Are you sure you want to delete this conversion?")) {
      await onDelete(conversion.id);
    }
  };

  const relativeTime = formatRelativeTime(new Date(conversion.createdAt));

  return (
    <div
      className={`conversion-item ${isActive ? "conversion-item-active" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Thumbnail */}
      <img
        src={conversion.originalUrl}
        alt={conversion.originalName}
        className="thumbnail"
        loading="lazy"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {conversion.originalName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {relativeTime}
        </p>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="p-2 text-gray-400 hover:text-error-600 dark:hover:text-error-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label={`Delete ${conversion.originalName}`}
        title="Delete"
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
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}
