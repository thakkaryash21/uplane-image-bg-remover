"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "./button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false,
}: ConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Lock body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, isLoading]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 min-h-screen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-up border border-gray-100 dark:border-gray-800">
        <div className="p-6">
          <h3
            id="modal-title"
            className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2"
          >
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 sm:flex-initial"
            >
              {cancelText}
            </Button>
            <Button
              variant={isDestructive ? "danger" : "primary"}
              onClick={onConfirm}
              isLoading={isLoading}
              className="flex-1 sm:flex-initial"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
