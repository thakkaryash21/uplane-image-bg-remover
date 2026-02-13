"use client";

import Modal from "./modal";
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
  return (
    <Modal isOpen={isOpen} onClose={onClose} preventClose={isLoading}>
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
    </Modal>
  );
}
