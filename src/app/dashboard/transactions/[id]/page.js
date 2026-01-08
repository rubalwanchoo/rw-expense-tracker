"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import AppIcon from "@/components/AppIcon";
import Notification from "@/components/Notification";

export default function TransactionsPage() {
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [notification, setNotification] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    trans_date: "",
    amount: "",
    description: "",
    merchant: "",
    source: "",
  });

  const [editFormData, setEditFormData] = useState({
    trans_date: "",
    amount: "",
    description: "",
    merchant: "",
    source: "",
  });

  // Notification handler
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Auth check and fetch project details
  useEffect(() => {
    const authed =
      typeof window !== "undefined" &&
      localStorage.getItem("app_logged_in") === "true";
    if (!authed) {
      router.replace("/");
      return;
    }

    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) throw error;
        setProject(data);
      } catch (error) {
        console.error("Error fetching project:", error.message);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProject();
    }
  }, [params.id, router]);

  const handleBack = () => {
    router.push("/dashboard");
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("app_logged_in");
    }
    router.replace("/");
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Modal handlers
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      trans_date: "",
      amount: "",
      description: "",
      merchant: "",
      source: "",
    });
  };

  const openEditModal = (transaction) => {
    setTransactionToEdit(transaction);
    setEditFormData({
      trans_date: transaction.trans_date || "",
      amount: transaction.amount || "",
      description: transaction.description || "",
      merchant: transaction.merchant || "",
      source: transaction.source || "",
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setTransactionToEdit(null);
    setEditFormData({
      trans_date: "",
      amount: "",
      description: "",
      merchant: "",
      source: "",
    });
  };

  const openDeleteModal = (transaction) => {
    setTransactionToDelete(transaction);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setTransactionToDelete(null);
    setDeletePassword("");
  };

  // CRUD operations
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // Create new transaction with unique ID
      const newTransaction = {
        id: Date.now(),
        ...formData,
        project_id: params.id,
      };
      setTransactions((prev) => [newTransaction, ...prev]);
      closeModal();
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
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionToEdit.id ? { ...t, ...editFormData } : t
        )
      );
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

    // Validate password
    const correctPassword = process.env.NEXT_PUBLIC_PROJECT_DELETE_PASSWORD;
    if (deletePassword !== correctPassword) {
      showNotification("Incorrect delete password. Please try again.", "error");
      return;
    }

    try {
      setDeleting(true);
      setTransactions((prev) => prev.filter((t) => t.id !== transactionToDelete.id));
      closeDeleteModal();
      showNotification("Transaction deleted successfully!", "delete");
    } catch (error) {
      console.error("Error deleting transaction:", error.message);
      showNotification("Failed to delete transaction. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-sans">
        <Header showLogout onLogout={handleLogout} />
        <main className="mx-auto max-w-4xl px-6 py-16">
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"></div>
            <p className="text-slate-400">Loading project...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-sans">
      <Notification
        notification={notification}
        onClose={() => setNotification(null)}
      />
      <Header showLogout onLogout={handleLogout} />

      <main className="relative mx-auto max-w-4xl px-6 py-8">
        <AppIcon />
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="group mb-6 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-emerald-400 transition-all duration-300 hover:bg-emerald-500/10 hover:text-emerald-300"
        >
          <svg
            className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Projects
        </button>

        {/* Project Header */}
        <div className="mb-8 rounded-2xl border border-slate-700/60 bg-slate-800/70 p-6 backdrop-blur">
          <h2 className="mb-2 text-2xl font-bold text-white">
            {project?.name || "Project"}
          </h2>
          {project?.description && (
            <p className="text-slate-400">{project.description}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
            <span>
              Created: {project?.dtm_created ? new Date(project.dtm_created).toLocaleString() : "-"}
            </span>
            <span>
              Last Updated: {project?.dtm_modified ? new Date(project.dtm_modified).toLocaleString() : "-"}
            </span>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/70 p-6 backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Transactions</h3>
            <button
              onClick={openModal}
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25"
            >
              Add Transaction
            </button>
          </div>

          {/* Transactions Table */}
          <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/80">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-400">
                    Trans_Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-400">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-400">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-400">
                    Merchant
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-400">
                    Source
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg
                          className="h-12 w-12 text-slate-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                          />
                        </svg>
                        <p className="text-slate-400">No transactions yet</p>
                        <p className="text-sm text-slate-500">
                          Click &quot;Add Transaction&quot; to record your first expense
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-slate-700/30 transition-colors hover:bg-slate-700/20"
                    >
                      <td className="px-6 py-4 text-left text-white">
                        {transaction.trans_date || "-"}
                      </td>
                      <td className="px-6 py-4 text-left text-slate-300">
                        {transaction.amount || "-"}
                      </td>
                      <td className="px-6 py-4 text-left text-slate-300">
                        {transaction.description || "-"}
                      </td>
                      <td className="px-6 py-4 text-left text-slate-300">
                        {transaction.merchant || "-"}
                      </td>
                      <td className="px-6 py-4 text-left text-slate-300">
                        {transaction.source || "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="group rounded-lg p-2 text-blue-500 transition-all duration-200 hover:bg-blue-500/20 hover:text-blue-300"
                            title="Edit"
                            onClick={() => openEditModal(transaction)}
                          >
                            <svg
                              className="h-5 w-5 transition-transform duration-200 group-hover:scale-125 group-hover:rotate-12"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            className="group rounded-lg p-2 text-red-500 transition-all duration-200 hover:bg-red-500/20 hover:text-red-300"
                            title="Delete"
                            onClick={() => openDeleteModal(transaction)}
                          >
                            <svg
                              className="h-5 w-5 transition-transform duration-200 group-hover:scale-125 group-hover:animate-pulse"
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-800/95 p-8 shadow-2xl">
            <h3 className="mb-6 text-2xl font-semibold text-white">Add Transaction</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="trans_date"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Transaction Date
                </label>
                <input
                  id="trans_date"
                  name="trans_date"
                  type="date"
                  value={formData.trans_date}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label
                  htmlFor="amount"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Amount
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Description
                </label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Enter description"
                />
              </div>
              <div>
                <label
                  htmlFor="merchant"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Merchant
                </label>
                <input
                  id="merchant"
                  name="merchant"
                  type="text"
                  value={formData.merchant}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Enter merchant name"
                />
              </div>
              <div>
                <label
                  htmlFor="source"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Source
                </label>
                <input
                  id="source"
                  name="source"
                  type="text"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Enter source (e.g., Credit Card, Cash)"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 font-semibold text-slate-300 transition-colors hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-800/95 p-8 shadow-2xl">
            <h3 className="mb-6 text-2xl font-semibold text-white">Edit Transaction</h3>
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="edit_trans_date"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Transaction Date
                </label>
                <input
                  id="edit_trans_date"
                  name="trans_date"
                  type="date"
                  value={editFormData.trans_date}
                  onChange={handleEditInputChange}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label
                  htmlFor="edit_amount"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Amount
                </label>
                <input
                  id="edit_amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={editFormData.amount}
                  onChange={handleEditInputChange}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label
                  htmlFor="edit_description"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Description
                </label>
                <input
                  id="edit_description"
                  name="description"
                  type="text"
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Enter description"
                />
              </div>
              <div>
                <label
                  htmlFor="edit_merchant"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Merchant
                </label>
                <input
                  id="edit_merchant"
                  name="merchant"
                  type="text"
                  value={editFormData.merchant}
                  onChange={handleEditInputChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Enter merchant name"
                />
              </div>
              <div>
                <label
                  htmlFor="edit_source"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Source
                </label>
                <input
                  id="edit_source"
                  name="source"
                  type="text"
                  value={editFormData.source}
                  onChange={handleEditInputChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Enter source (e.g., Credit Card, Cash)"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 font-semibold text-slate-300 transition-colors hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50"
                >
                  {updating ? "Updating..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Transaction Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-800/95 p-8 shadow-2xl">
            <h3 className="mb-4 text-2xl font-semibold text-white">Delete Transaction</h3>
            <p className="mb-6 text-slate-400">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            <form onSubmit={handleDelete} className="space-y-5">
              <div>
                <label
                  htmlFor="delete_password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Delete Password <span className="text-red-400">*</span>
                </label>
                <input
                  id="delete_password"
                  name="delete_password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="Enter delete password"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 font-semibold text-slate-300 transition-colors hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 px-4 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
