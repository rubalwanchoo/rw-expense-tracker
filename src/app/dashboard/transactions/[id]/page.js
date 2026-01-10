"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchTransactions as fetchTransactionsService, createTransaction, deleteMultipleTransactions } from "@/lib/transactions";
import Header from "@/components/Header";
import Notification from "@/components/Notification";
import Footer from "@/components/Footer";
import FilterBox from "@/components/FilterBox";
import AddTransactionButton from "@/components/AddTransactionButton";
import ScanReceiptButton from "@/components/ScanReceiptButton";
import TransactionsTable from "@/components/TransactionsTable";
import TransactionModals from "@/components/modals/TransactionModals";
import DateRangeModal from "@/components/modals/DateRangeModal";
import BulkDeleteTransactionsModal from "@/components/modals/BulkDeleteTransactionsModal";
import ScanReceiptModal from "@/components/modals/ScanReceiptModal";

export default function TransactionsPage() {
  const router = useRouter();
  const params = useParams();
  
  // State Management
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [notification, setNotification] = useState(null);
  const [filterText, setFilterText] = useState("");
  
  // Date range for totals (applied values)
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  
  // Pending date range (values in the modal before Apply is pressed)
  const [pendingDateStart, setPendingDateStart] = useState("");
  const [pendingDateEnd, setPendingDateEnd] = useState("");
  
  // Sort direction for date (asc = oldest first, desc = newest first)
  const [sortDirection, setSortDirection] = useState("desc");
  
  // Date range picker dropdown
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  
  // Open date range modal and sync pending values with current values
  const openDateRangeModal = () => {
    setPendingDateStart(dateRangeStart);
    setPendingDateEnd(dateRangeEnd);
    setIsDateRangeOpen(true);
  };
  
  // Apply the pending date range
  const applyDateRange = () => {
    setDateRangeStart(pendingDateStart);
    setDateRangeEnd(pendingDateEnd);
    setIsDateRangeOpen(false);
  };
  
  // Clear date range
  const clearDateRange = () => {
    setPendingDateStart("");
    setPendingDateEnd("");
    setDateRangeStart("");
    setDateRangeEnd("");
    setIsDateRangeOpen(false);
  };

  // Modal visibility states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  
  // Scanned receipt data
  const [scannedFormData, setScannedFormData] = useState(null);
  
  // Loading state for receipt processing
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  
  // Multi-select state
  const [selectedTransactionIds, setSelectedTransactionIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeletePassword, setBulkDeletePassword] = useState("");
  
  // Scan Receipt Modal state
  const [isScanReceiptModalOpen, setIsScanReceiptModalOpen] = useState(false);
  
  // Combined disabled state
  const isTableDisabled = isProcessingReceipt || isBulkDeleting;

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
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setScannedFormData(null); // Reset scanned data when closing
  };

  // Helper function to normalize date from receipt scan
  // If year is missing or seems wrong:
  // - If month/day has already passed this year → use current year
  // - If month/day is in the future this year → use last year
  const normalizeTransactionDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const lastYear = currentYear - 1;
    
    // Try to parse the date
    let parsedDate = new Date(dateStr);
    
    // If invalid date, return today
    if (isNaN(parsedDate.getTime())) {
      console.log(`  ⚠️ Invalid date "${dateStr}", using today's date`);
      return today.toISOString().split('T')[0];
    }
    
    const parsedYear = parsedDate.getFullYear();
    const parsedMonth = parsedDate.getMonth(); // 0-indexed
    const parsedDay = parsedDate.getDate();
    
    // If year seems wrong (too old or in the future beyond current year)
    // Smart logic: check if month/day has elapsed in current year
    if (parsedYear < lastYear || parsedYear > currentYear) {
      // Create date with current year to compare
      const dateThisYear = new Date(currentYear, parsedMonth, parsedDay);
      
      // If the date this year is in the future, use last year
      // Otherwise use current year
      let targetYear;
      if (dateThisYear > today) {
        targetYear = lastYear;
        console.log(`  📅 Date "${dateStr}" → ${targetYear}-${String(parsedMonth + 1).padStart(2, '0')}-${String(parsedDay).padStart(2, '0')} (month/day hasn't occurred yet this year, using last year)`);
      } else {
        targetYear = currentYear;
        console.log(`  📅 Date "${dateStr}" → ${targetYear}-${String(parsedMonth + 1).padStart(2, '0')}-${String(parsedDay).padStart(2, '0')} (month/day has passed, using current year)`);
      }
      
      const month = String(parsedMonth + 1).padStart(2, '0');
      const day = String(parsedDay).padStart(2, '0');
      return `${targetYear}-${month}-${day}`;
    }
    
    // Return in YYYY-MM-DD format (year is already valid)
    const year = parsedDate.getFullYear();
    const month = String(parsedMonth + 1).padStart(2, '0');
    const day = String(parsedDay).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Scan Receipt Modal handlers
  const openScanReceiptModal = () => setIsScanReceiptModalOpen(true);
  const closeScanReceiptModal = () => setIsScanReceiptModalOpen(false);

  // Helper function to convert File to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      } catch (err) {
        reject(err);
      }
    });
  };

  // Handle scan receipt submission from modal
  const handleScanSubmit = async (file, bankSource) => {
    // Close modal and show loading
    setIsScanReceiptModalOpen(false);
    setIsProcessingReceipt(true);

    try {
      // Validate file exists
      if (!file) {
        throw new Error("No file provided");
      }

      // Step 1: Convert to base64
      let base64Data;
      try {
        base64Data = await fileToBase64(file);
      } catch (convErr) {
        throw new Error("Failed to process image: " + String(convErr.message || "conversion error"));
      }

      // Step 2: Prepare request body - sanitize filename for iOS
      let requestBody;
      try {
        // Ensure filename is safe (ASCII only)
        const safeFilename = String(file.name || "photo.jpg").replace(/[^\x00-\x7F]/g, "");
        requestBody = JSON.stringify({
          image: base64Data,
          filename: safeFilename || "photo.jpg",
        });
      } catch (jsonErr) {
        throw new Error("Failed to prepare request: " + String(jsonErr.message || "JSON error"));
      }

      // Step 3: Send to API
      let response;
      try {
        response = await fetch("/api/parse-expense", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: requestBody,
        });
      } catch (fetchErr) {
        throw new Error("Network error: " + String(fetchErr.message || "fetch failed"));
      }

      // Step 4: Parse response
      let result;
      try {
        result = await response.json();
      } catch (parseErr) {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(result.error || "Failed to parse receipt");
      }

      if (result.success && result.data) {
        let transactions = Array.isArray(result.data) ? result.data : [result.data];
        
        // Apply the user-provided bank source to all transactions
        transactions = transactions.map(t => ({
          ...t,
          source: bankSource,
        }));
        
        await handleExpenseParsed(transactions);
      } else {
        setIsProcessingReceipt(false);
        showNotification("No data found in receipt", "error");
      }
    } catch (error) {
      showNotification(String(error.message || "Failed to scan receipt. Please try again."), "error");
      setIsProcessingReceipt(false);
    }
  };

  // Handle scanned receipt data - auto-create multiple transactions
  const handleExpenseParsed = async (parsedDataArray) => {
    try {
      // Ensure we have an array
      const transactionsToCreate = Array.isArray(parsedDataArray) ? parsedDataArray : [parsedDataArray];
      
      console.log(`📝 Creating ${transactionsToCreate.length} transaction(s) from scanned data...`);

      const createdTransactions = [];
      let successCount = 0;
      let errorCount = 0;

      for (const parsedData of transactionsToCreate) {
        try {
          // Prepare transaction data with defaults for null values
          // Use normalizeTransactionDate to fix year issues from receipt parsing
          const transactionData = {
            project_id: params.id,
            trans_date: normalizeTransactionDate(parsedData.trans_date),
            amount: parsedData.amount || 0,
            type: parsedData.type || "Expense",
            description: parsedData.description || "Scanned receipt",
            source: parsedData.source || "NA", // Default to NA if null
          };

          console.log(`  → Creating: ${transactionData.description} ($${transactionData.amount})`);

          // Get logged in username
          const username = typeof window !== "undefined" 
            ? localStorage.getItem("app_username") || "system" 
            : "system";
          
          const { data, error } = await createTransaction(transactionData, username);

          if (error) {
            console.error("Error creating transaction:", error);
            errorCount++;
          } else {
            createdTransactions.push(data);
            successCount++;
          }
        } catch (itemError) {
          console.error("Error processing transaction item:", itemError);
          errorCount++;
        }
      }

      // Add all created transactions to the list and update project modified date
      if (createdTransactions.length > 0) {
        setTransactions((prev) => [...createdTransactions, ...prev]);
        // Update project's modified date in local state
        setProject((prev) => ({
          ...prev,
          dtm_modified: new Date().toISOString(),
        }));
      }

      // Show appropriate notification
      if (successCount > 0 && errorCount === 0) {
        showNotification(`${successCount} transaction(s) created from receipt!`, "success");
      } else if (successCount > 0 && errorCount > 0) {
        showNotification(`${successCount} created, ${errorCount} failed`, "success");
      } else {
        showNotification("Failed to create transactions. Please try again.", "error");
      }

      console.log(`✅ Created ${successCount} transaction(s), ${errorCount} error(s)`);
    } catch (error) {
      console.error("Error creating transactions from scan:", error);
      showNotification("Failed to create transactions. Please try again.", "error");
    } finally {
      // Release loading state
      setIsProcessingReceipt(false);
    }
  };

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

  // Helper to update project's modified date in local state
  const updateProjectModifiedDate = () => {
    setProject((prev) => ({
      ...prev,
      dtm_modified: new Date().toISOString(),
    }));
  };

  // Transaction update callbacks
  const handleTransactionCreated = (newTransaction) => {
    setTransactions((prev) => [newTransaction, ...prev]);
    updateProjectModifiedDate();
  };

  const handleTransactionUpdated = (id, updatedTransaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? updatedTransaction : t))
    );
  };

  const handleTransactionDeleted = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Open bulk delete confirmation modal
  const openBulkDeleteModal = () => {
    if (selectedTransactionIds.length === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  // Close bulk delete confirmation modal
  const closeBulkDeleteModal = () => {
    setIsBulkDeleteModalOpen(false);
    setBulkDeletePassword("");
  };

  // Handle bulk delete of selected transactions
  const handleBulkDeleteConfirm = async (e) => {
    e.preventDefault();
    if (selectedTransactionIds.length === 0) return;
    
    // Validate password
    const correctPassword = process.env.NEXT_PUBLIC_PROJECT_DELETE_PASSWORD;
    if (bulkDeletePassword !== correctPassword) {
      showNotification("Incorrect delete password. Please try again.", "error");
      return;
    }
    
    setIsBulkDeleteModalOpen(false);
    setBulkDeletePassword("");
    setIsBulkDeleting(true);
    
    try {
      const { successCount, errorCount, error } = await deleteMultipleTransactions(
        selectedTransactionIds,
        params.id
      );
      
      if (error) {
        showNotification("Failed to delete transactions. Please try again.", "error");
      } else {
        // Remove deleted transactions from local state
        setTransactions((prev) => 
          prev.filter((t) => !selectedTransactionIds.includes(t.id))
        );
        
        // Clear selection
        setSelectedTransactionIds([]);
        
        // Update project modified date
        updateProjectModifiedDate();
        
        if (errorCount > 0) {
          showNotification(`Deleted ${successCount}, failed ${errorCount}`, "success");
        } else {
          showNotification(`${successCount} transaction(s) deleted successfully!`, "delete");
        }
      }
    } catch (error) {
      console.error("Error during bulk delete:", error);
      showNotification("Failed to delete transactions. Please try again.", "error");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Handle selection change from table
  const handleSelectionChange = (newSelectedIds) => {
    setSelectedTransactionIds(newSelectedIds);
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

  // Derived filtered transactions (sorted by date based on sortDirection)
  // Uses dateFilteredTransactions as base so date range filter affects the table
  const filteredTransactions = (() => {
    let result =
      filterText.trim().length === 0
        ? [...dateFilteredTransactions]
        : dateFilteredTransactions.filter((transaction) => {
            const query = filterText.toLowerCase();
            const description = transaction.description?.toLowerCase() || "";
            const source = transaction.source?.toLowerCase() || "";
            return (
              description.includes(query) ||
              source.includes(query)
            );
          });

    // Sort by date based on sortDirection
    result.sort((a, b) => {
      const aVal = a.trans_date || "";
      const bVal = b.trans_date || "";
      if (sortDirection === "desc") {
        return bVal.localeCompare(aVal); // Newest first
      } else {
        return aVal.localeCompare(bVal); // Oldest first
      }
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
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
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
              {/* Date Range Picker */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openDateRangeModal}
                  className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-xs font-medium text-slate-300 transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {dateRangeStart || dateRangeEnd
                      ? `${dateRangeStart || "Start"} → ${dateRangeEnd || "End"}`
                      : "Date Range"}
                  </span>
                </button>
                {/* Clear button - only shown when date range is selected */}
                {(dateRangeStart || dateRangeEnd) && (
                  <button
                    type="button"
                    onClick={clearDateRange}
                    className="rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-red-500/20 hover:text-red-400"
                    title="Clear date range"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
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
        <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/70 p-4 backdrop-blur sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-white sm:text-xl">Transactions</h3>
              <FilterBox
                value={filterText}
                onChange={handleFilterChange}
                placeholder="Filter..."
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AddTransactionButton onClick={openCreateModal} disabled={isTableDisabled} />
              <ScanReceiptButton onClick={openScanReceiptModal} disabled={isTableDisabled} />
              {/* Bulk Delete Button - shown when items are selected */}
              {selectedTransactionIds.length > 0 && (
                <button
                  onClick={openBulkDeleteModal}
                  disabled={isTableDisabled}
                  className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg
                    className="h-4 w-4"
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
                  <span>Delete ({selectedTransactionIds.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Sort Option + Counts */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Sort by Date:</span>
              <button
                onClick={() => setSortDirection(sortDirection === "desc" ? "asc" : "desc")}
                className="flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400"
              >
                {sortDirection === "desc" ? (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Newest First
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Oldest First
                  </>
                )}
              </button>
            </div>
            
            {/* Transaction Counts */}
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-1 text-red-400">
                <span className="font-medium">Expenses:</span>
                <span className="font-bold">{filteredTransactions.filter(t => t.type === "Expense").length}</span>
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-400">
                <span className="font-medium">Income:</span>
                <span className="font-bold">{filteredTransactions.filter(t => t.type === "Income").length}</span>
              </span>
            </div>
          </div>

          {/* Processing Overlay - Fixed to viewport */}
          {(isProcessingReceipt || isBulkDeleting) && (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
              <div className="rounded-2xl border border-slate-700/60 bg-slate-800/95 p-8 shadow-2xl">
                <div className="flex flex-col items-center">
                  <div className={`h-12 w-12 animate-spin rounded-full border-4 border-t-transparent ${isBulkDeleting ? "border-red-400" : "border-emerald-400"}`}></div>
                  <p className={`mt-4 text-lg font-medium ${isBulkDeleting ? "text-red-400" : "text-emerald-400"}`}>
                    {isBulkDeleting ? "Deleting transactions..." : "Processing receipt..."}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {isBulkDeleting ? `Removing ${selectedTransactionIds.length} item(s)` : "Creating transactions"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <TransactionsTable
            transactions={filteredTransactions}
            loading={false}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
            disabled={isTableDisabled}
            selectedIds={selectedTransactionIds}
            onSelectionChange={handleSelectionChange}
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
        initialFormData={scannedFormData}
      />

      {/* Date Range Modal */}
      <DateRangeModal
        isOpen={isDateRangeOpen}
        pendingDateStart={pendingDateStart}
        pendingDateEnd={pendingDateEnd}
        onPendingDateStartChange={setPendingDateStart}
        onPendingDateEndChange={setPendingDateEnd}
        onApply={applyDateRange}
        onClear={clearDateRange}
        onClose={() => setIsDateRangeOpen(false)}
      />

      {/* Bulk Delete Confirmation Modal */}
      <BulkDeleteTransactionsModal
        isOpen={isBulkDeleteModalOpen}
        selectedCount={selectedTransactionIds.length}
        password={bulkDeletePassword}
        onPasswordChange={setBulkDeletePassword}
        onSubmit={handleBulkDeleteConfirm}
        onClose={closeBulkDeleteModal}
      />

      {/* Scan Receipt Modal */}
      <ScanReceiptModal
        isOpen={isScanReceiptModalOpen}
        onClose={closeScanReceiptModal}
        onScanSubmit={handleScanSubmit}
      />

      <Footer />
    </div>
  );
}
