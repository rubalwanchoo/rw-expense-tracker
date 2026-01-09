"use client";

import { useState, useEffect } from "react";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/transactions";
import CreateTransactionModal from "@/components/modals/CreateTransactionModal";
import EditTransactionModal from "@/components/modals/EditTransactionModal";
import DeleteTransactionModal from "@/components/modals/DeleteTransactionModal";

export default function TransactionModals({
  projectId,
  onTransactionCreated,
  onTransactionUpdated,
  onTransactionDeleted,
  showNotification,
  // Modal control props
  isCreateModalOpen,
  onCloseCreateModal,
  isEditModalOpen,
  transactionToEdit,
  onCloseEditModal,
  isDeleteModalOpen,
  transactionToDelete,
  onCloseDeleteModal,
  // Pre-filled data from receipt scan
  initialFormData,
}) {
  // Form data states
  const [formData, setFormData] = useState({
    trans_date: "",
    amount: "",
    type: "",
    description: "",
    source: "",
  });

  // Update form data when initialFormData changes (from receipt scan)
  useEffect(() => {
    if (initialFormData) {
      setFormData({
        trans_date: initialFormData.trans_date || "",
        amount: initialFormData.amount != null ? String(initialFormData.amount) : "",
        type: initialFormData.type || "Expense",
        description: initialFormData.description || "",
        source: initialFormData.source || "",
      });
    }
  }, [initialFormData]);

  const [editFormData, setEditFormData] = useState({
    trans_date: "",
    amount: "",
    type: "",
    description: "",
    source: "",
  });

  const [deletePassword, setDeletePassword] = useState("");

  // Loading states
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Close handlers with form reset
  const closeCreateModal = () => {
    setFormData({
      trans_date: "",
      amount: "",
      type: "",
      description: "",
      source: "",
    });
    onCloseCreateModal();
  };

  const closeEditModal = () => {
    setEditFormData({
      trans_date: "",
      amount: "",
      type: "",
      description: "",
      source: "",
    });
    onCloseEditModal();
  };

  const closeDeleteModal = () => {
    setDeletePassword("");
    onCloseDeleteModal();
  };

  // Initialize edit form when transaction changes
  if (transactionToEdit && editFormData.trans_date === "" && isEditModalOpen) {
    setEditFormData({
      trans_date: transactionToEdit.trans_date || "",
      amount: transactionToEdit.amount || "",
      type: transactionToEdit.type || "",
      description: transactionToEdit.description || "",
      source: transactionToEdit.source || "",
    });
  }

  // CRUD operations
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { data, error } = await createTransaction({
        project_id: projectId,
        trans_date: formData.trans_date,
        amount: formData.amount,
        type: formData.type,
        description: formData.description,
        source: formData.source,
      });

      if (error) throw error;

      onTransactionCreated(data);
      closeCreateModal();
      showNotification("Transaction added successfully!", "success");
    } catch (error) {
      console.error("Error adding transaction:", error.message);
      showNotification("Failed to add transaction. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!transactionToEdit) return;

    try {
      setUpdating(true);
      const { data, error } = await updateTransaction(transactionToEdit.id, {
        trans_date: editFormData.trans_date,
        amount: editFormData.amount,
        type: editFormData.type,
        description: editFormData.description,
        source: editFormData.source,
      });

      if (error) throw error;

      onTransactionUpdated(transactionToEdit.id, data);
      closeEditModal();
      showNotification("Transaction updated successfully!", "success");
    } catch (error) {
      console.error("Error updating transaction:", error.message);
      showNotification("Failed to update transaction. Please try again.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!transactionToDelete) return;

    const correctPassword = process.env.NEXT_PUBLIC_PROJECT_DELETE_PASSWORD;
    if (deletePassword !== correctPassword) {
      showNotification("Incorrect delete password. Please try again.", "error");
      return;
    }

    try {
      setDeleting(true);
      const { success, error } = await deleteTransaction(transactionToDelete.id);

      if (error) throw error;
      if (!success) throw new Error("Delete operation failed");

      onTransactionDeleted(transactionToDelete.id);
      closeDeleteModal();
      showNotification("Transaction deleted successfully!", "delete");
    } catch (error) {
      console.error("Error deleting transaction:", error.message);
      showNotification("Failed to delete transaction. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <CreateTransactionModal
        isOpen={isCreateModalOpen}
        formData={formData}
        saving={saving}
        onClose={closeCreateModal}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
      />

      <EditTransactionModal
        isOpen={isEditModalOpen}
        transaction={transactionToEdit}
        formData={editFormData}
        updating={updating}
        onClose={closeEditModal}
        onSubmit={handleEditSubmit}
        onInputChange={handleEditInputChange}
      />

      <DeleteTransactionModal
        isOpen={isDeleteModalOpen}
        transaction={transactionToDelete}
        deletePassword={deletePassword}
        deleting={deleting}
        onClose={closeDeleteModal}
        onSubmit={handleDelete}
        onPasswordChange={(e) => setDeletePassword(e.target.value)}
      />
    </>
  );
}
