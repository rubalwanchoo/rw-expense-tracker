"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  fetchTransactions as fetchTransactionsService,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/transactions";
import Header from "@/components/Header";
import AppIcon from "@/components/AppIcon";
import Notification from "@/components/Notification";
import FilterBox from "@/components/FilterBox";
import AddTransactionButton from "@/components/AddTransactionButton";
import TransactionsTable from "@/components/TransactionsTable";
import CreateTransactionModal from "@/components/modals/CreateTransactionModal";
import EditTransactionModal from "@/components/modals/EditTransactionModal";
import DeleteTransactionModal from "@/components/modals/DeleteTransactionModal";

export default function TransactionsPage() {
  const router = useRouter();
  const params = useParams();
  
  // State Management
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [notification, setNotification] = useState(null);
  const [filterText, setFilterText] = useState("");
  const [sortColumn, setSortColumn] = useState("trans_date");
  const [sortDirection, setSortDirection] = useState("desc");

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
    type: "",
    description: "",
    merchant: "",
    source: "",
  });

  const [editFormData, setEditFormData] = useState({
    trans_date: "",
    amount: "",
    type: "",
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

  // Auth check and fetch project details + transactions
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

    const loadTransactions = async () => {
      try {
        const { data, error } = await fetchTransactionsService(params.id);
        if (error) throw error;
        setTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error.message);
      }
    };

    if (params.id) {
      fetchProject();
      loadTransactions();
    }
  }, [params.id, router]);

  // Navigation handlers
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

  const handleFilterChange = (e) => {
    setFilterText(e.target.value);
  };

  // Modal handlers
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      trans_date: "",
      amount: "",
      type: "",
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
      type: transaction.type || "",
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
      type: "",
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
      const { data, error } = await createTransaction({
        project_id: params.id,
        trans_date: formData.trans_date,
        amount: formData.amount,
        type: formData.type,
        description: formData.description,
        merchant: formData.merchant,
        source: formData.source,
      });

      if (error) throw error;

      setTransactions((prev) => [data, ...prev]);
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
      const { data, error } = await updateTransaction(transactionToEdit.id, {
        trans_date: editFormData.trans_date,
        amount: editFormData.amount,
        type: editFormData.type,
        description: editFormData.description,
        merchant: editFormData.merchant,
        source: editFormData.source,
      });

      if (error) throw error;

      setTransactions((prev) =>
        prev.map((t) => (t.id === transactionToEdit.id ? data : t))
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

  // Sort handler
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Derived filtered and sorted transactions
  const filteredTransactions = (() => {
    let result =
      filterText.trim().length === 0
        ? [...transactions]
        : transactions.filter((transaction) => {
            const query = filterText.toLowerCase();
            const description = transaction.description?.toLowerCase() || "";
            const merchant = transaction.merchant?.toLowerCase() || "";
            const source = transaction.source?.toLowerCase() || "";
            return (
              description.includes(query) ||
              merchant.includes(query) ||
              source.includes(query)
            );
          });

    // Sort the results
    result.sort((a, b) => {
      let aVal, bVal;
      if (sortColumn === "trans_date") {
        aVal = a.trans_date || "";
        bVal = b.trans_date || "";
      } else if (sortColumn === "amount") {
        aVal = parseFloat(a.amount) || 0;
        bVal = parseFloat(b.amount) || 0;
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  })();

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
            <div className="flex items-center gap-3">
              <FilterBox
                value={filterText}
                onChange={handleFilterChange}
                placeholder="Filter transactions..."
              />
              <AddTransactionButton onClick={openModal} />
            </div>
          </div>

          <TransactionsTable
            transactions={filteredTransactions}
            loading={false}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
          />
        </div>
      </main>

      <CreateTransactionModal
        isOpen={isModalOpen}
        formData={formData}
        saving={saving}
        onClose={closeModal}
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
    </div>
  );
}
