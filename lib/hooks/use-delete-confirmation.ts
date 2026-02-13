import { useState } from "react";

interface UseDeleteConfirmationProps {
  onDelete: (id: string) => Promise<void>;
  onSuccess?: () => void;
}

export function useDeleteConfirmation({
  onDelete,
  onSuccess,
}: UseDeleteConfirmationProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    id: string;
    isOpen: boolean;
  }>({ id: "", isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);

  const requestDelete = (id: string) => {
    setDeleteConfirmation({ id, isOpen: true });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ ...deleteConfirmation, isOpen: false });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.id) return;

    setIsDeleting(true);
    try {
      await onDelete(deleteConfirmation.id);
      setDeleteConfirmation({ id: "", isOpen: false });
      onSuccess?.();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete conversion");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteConfirmation,
    isDeleting,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
