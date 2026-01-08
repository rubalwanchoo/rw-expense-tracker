"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchTransactions as fetchTransactionsService } from "@/lib/transactions";
import Header from "@/components/Header";
import AppIcon from "@/components/AppIcon";
import Notification from "@/components/Notification";
import Footer from "@/components/Footer";
import FilterBox from "@/components/FilterBox";
import AddTransactionButton from "@/components/AddTransactionButton";
import TransactionsTable from "@/components/TransactionsTable";
import DateInput from "@/components/DateInput";
import TransactionModals from "./TransactionModals";

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
  
  // Date range for totals
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");

  // Modal visibility states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

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

  // Filter handler
  const handleFilterChange = (e) => {
    setFilterText(e.target.value);
  };

  // Modal handlers
  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  const openEditModal = (transaction) => {
    setTransactionToEdit(transaction);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setTransactionToEdit(null);
  };

  const openDeleteModal = (transaction) => {
    setTransactionToDelete(transaction);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setTransactionToDelete(null);
  };

  // Transaction update callbacks
  const handleTransactionCreated = (newTransaction) => {
    setTransactions((prev) => [newTransaction, ...prev]);
  };

  const handleTransactionUpdated = (id, updatedTransaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? updatedTransaction : t))
    );
  };

  const handleTransactionDeleted = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
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

  // Filter transactions by date range for totals
  const dateFilteredTransactions = transactions.filter((t) => {
    if (!t.trans_date) return true;
    const transDate = new Date(t.trans_date);
    if (dateRangeStart && transDate < new Date(dateRangeStart)) return false;
    if (dateRangeEnd && transDate > new Date(dateRangeEnd)) return false;
    return true;
  });

  // Calculate totals from date-filtered transactions
  const totalIncome = dateFilteredTransactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const totalExpenses = dateFilteredTransactions
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

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
      } else if (sortColumn === "description") {
        aVal = (a.description || "").toLowerCase();
        bVal = (b.description || "").toLowerCase();
      } else if (sortColumn === "merchant") {
        aVal = (a.merchant || "").toLowerCase();
        bVal = (b.merchant || "").toLowerCase();
      } else if (sortColumn === "source") {
        aVal = (a.source || "").toLowerCase();
        bVal = (b.source || "").toLowerCase();
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

      <main className="relative mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <AppIcon />
        
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="group mb-4 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-400 transition-all duration-300 hover:bg-emerald-500/10 hover:text-emerald-300 sm:mb-6 sm:px-4 sm:py-2 sm:text-sm"
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
        <div className="mb-6 rounded-2xl border border-slate-700/60 bg-slate-800/70 p-4 backdrop-blur sm:mb-8 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <h2 className="mb-2 text-xl font-bold text-white sm:text-2xl">
                {project?.name || "Project"}
              </h2>
              {project?.description && (
                <p className="text-sm text-slate-400 sm:text-base">{project.description}</p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-4 sm:gap-6">
                <div className="text-left sm:text-right">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 sm:text-xs">Total Income</p>
                  <p className="text-lg font-bold text-emerald-400 sm:text-xl">
                    ${totalIncome.toFixed(2)}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 sm:text-xs">Total Expenses</p>
                  <p className="text-lg font-bold text-red-400 sm:text-xl">
                    ${totalExpenses.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1 text-xs sm:gap-3">
                <span className="text-slate-400 font-medium text-[10px] sm:text-xs">Range:</span>
                <DateInput
                  id="dateRangeStart"
                  name="dateRangeStart"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  size="small"
                  className="w-[130px] sm:w-40"
                />
                <span className="text-slate-500 text-[10px] sm:text-xs">to</span>
                <DateInput
                  id="dateRangeEnd"
                  name="dateRangeEnd"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  size="small"
                  className="w-[130px] sm:w-40"
                />
                {(dateRangeStart || dateRangeEnd) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDateRangeStart("");
                      setDateRangeEnd("");
                    }}
                    className="min-h-[36px] min-w-[44px] rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-xs font-medium text-slate-400 transition-all duration-200 active:bg-red-500/20 active:text-red-400 sm:hover:border-red-500/50 sm:hover:bg-red-500/10 sm:hover:text-red-400"
                    title="Clear date range"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 sm:mt-4 sm:gap-4 sm:text-sm">
            <span>
              Created: {project?.dtm_created ? new Date(project.dtm_created).toLocaleDateString() : "-"}
            </span>
            <span>
              Updated: {project?.dtm_modified ? new Date(project.dtm_modified).toLocaleDateString() : "-"}
            </span>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/70 p-4 backdrop-blur sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-white sm:text-xl">Transactions</h3>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <FilterBox
                value={filterText}
                onChange={handleFilterChange}
                placeholder="Filter..."
              />
              <AddTransactionButton onClick={openCreateModal} />
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

      <TransactionModals
        projectId={params.id}
        onTransactionCreated={handleTransactionCreated}
        onTransactionUpdated={handleTransactionUpdated}
        onTransactionDeleted={handleTransactionDeleted}
        showNotification={showNotification}
        isCreateModalOpen={isCreateModalOpen}
        onCloseCreateModal={closeCreateModal}
        isEditModalOpen={isEditModalOpen}
        transactionToEdit={transactionToEdit}
        onCloseEditModal={closeEditModal}
        isDeleteModalOpen={isDeleteModalOpen}
        transactionToDelete={transactionToDelete}
        onCloseDeleteModal={closeDeleteModal}
      />

      <Footer />
    </div>
  );
}
