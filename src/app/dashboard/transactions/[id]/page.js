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
import { formatDateEST, getESTDateParts } from "@/lib/dateUtils";

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
  // All dates from LLM/receipts are treated as EST timezone (America/New_York)
  // This function ensures proper year inference:
  // - If month/day has already passed this year (EST) → use current year
  // - If month/day is in the future this year (EST) → use last year
  const normalizeTransactionDate = (dateStr) => {
    // Use shared utility to get current date parts in EST
    const est = getESTDateParts();
    
    if (!dateStr) {
      return `${est.year}-${String(est.month).padStart(2, '0')}-${String(est.day).padStart(2, '0')}`;
    }
    
    const currentYear = est.year;
    const lastYear = currentYear - 1;
    
    // Parse date string directly to avoid timezone issues
    // Expected format: YYYY-MM-DD
    const dateMatch = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    
    if (!dateMatch) {
      console.log(`  ⚠️ Invalid date format "${dateStr}", using today's date (EST)`);
      return `${est.year}-${String(est.month).padStart(2, '0')}-${String(est.day).padStart(2, '0')}`;
    }
    
    const parsedYear = parseInt(dateMatch[1], 10);
    const parsedMonth = parseInt(dateMatch[2], 10); // 1-indexed
    const parsedDay = parseInt(dateMatch[3], 10);
    
    // If year seems wrong (too old or in the future beyond current year)
    // Apply the elapsed logic: 
    // - If date HAS elapsed this year → use current year
    // - If date has NOT elapsed yet → use previous year
    if (parsedYear < lastYear || parsedYear > currentYear) {
      // Compare month/day to determine which year to use (using EST)
      const todayMonth = est.month; // 1-indexed
      const todayDay = est.day;
      
      // Check if date has elapsed (is in the past this year)
      const hasElapsed = (parsedMonth < todayMonth) || 
                         (parsedMonth === todayMonth && parsedDay <= todayDay);
      
      const targetYear = hasElapsed ? currentYear : lastYear;
      
      console.log(`  📅 Date "${dateStr}" → ${targetYear}-${String(parsedMonth).padStart(2, '0')}-${String(parsedDay).padStart(2, '0')} (hasElapsed=${hasElapsed})`);
      
      return `${targetYear}-${String(parsedMonth).padStart(2, '0')}-${String(parsedDay).padStart(2, '0')}`;
    }
    
    // Return the date as-is (year is already valid)
    return `${parsedYear}-${String(parsedMonth).padStart(2, '0')}-${String(parsedDay).padStart(2, '0')}`;
  };

  // Scan Receipt Modal handlers
  const openScanReceiptModal = () => setIsScanReceiptModalOpen(true);
  const closeScanReceiptModal = () => setIsScanReceiptModalOpen(false);

  // Helper function to convert PDF to image using pdf.js
  const convertPdfToImage = async (file, scale = 2.0) => {
    try {
      // Import pdf.js
      const pdfjsLib = await import("pdfjs-dist");
      
      // Set worker source from CDN (using jsdelivr which is more reliable)
      if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 
          `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      }

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
      }).promise;
      
      // Get total number of pages
      const numPages = pdf.numPages;
      console.log(`PDF has ${numPages} page(s)`);

      // For receipts, we'll process all pages and combine them vertically
      const canvases = [];
      let totalHeight = 0;
      let maxWidth = 0;

      for (let pageNum = 1; pageNum <= Math.min(numPages, 5); pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: ctx,
          viewport: viewport,
        }).promise;

        canvases.push(canvas);
        totalHeight += canvas.height;
        maxWidth = Math.max(maxWidth, canvas.width);
      }

      // Combine all pages into one tall image
      const combinedCanvas = document.createElement("canvas");
      combinedCanvas.width = maxWidth;
      combinedCanvas.height = totalHeight;
      const combinedCtx = combinedCanvas.getContext("2d");

      // Fill with white background
      combinedCtx.fillStyle = "#ffffff";
      combinedCtx.fillRect(0, 0, maxWidth, totalHeight);

      // Draw each page
      let yOffset = 0;
      for (const canvas of canvases) {
        combinedCtx.drawImage(canvas, 0, yOffset);
        yOffset += canvas.height;
      }

      // Convert to base64 JPEG
      const base64 = combinedCanvas.toDataURL("image/jpeg", 0.85);
      console.log(`PDF converted to image: ${(base64.length / 1024).toFixed(1)} KB`);
      
      return base64;
    } catch (error) {
      console.error("PDF conversion error:", error);
      throw new Error("Failed to process PDF: " + (error.message || "Unknown error"));
    }
  };

  // Helper function to compress and convert image to base64
  // Optimized for speed: smaller resolution for faster API processing
  const compressAndConvertToBase64 = (file, maxWidth = 1200, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        img.onload = () => {
          try {
            // Calculate new dimensions
            let width = img.width;
            let height = img.height;

            // Scale down large images for faster processing
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }

            // Cap height as well
            const maxHeight = 1600;
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }

            canvas.width = width;
            canvas.height = height;

            // Use high-quality image rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // Draw the image
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to JPEG
            const base64 = canvas.toDataURL("image/jpeg", quality);
            console.log(`📷 Image compressed: ${width}x${height}, ${(base64.length / 1024).toFixed(1)}KB`);
            resolve(base64);
          } catch (canvasErr) {
            reject(canvasErr);
          }
        };

        img.onerror = () => reject(new Error("Failed to load image"));

        // Read file as data URL to load into image
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target.result;
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

      // Detect if file is a PDF
      const isPdf = file.type === "application/pdf" || 
                    file.name?.toLowerCase().endsWith(".pdf");

      // Step 1: Convert to base64 (PDF or image)
      let base64Data;
      try {
        if (isPdf) {
          console.log("Processing PDF file...");
          base64Data = await convertPdfToImage(file, 2.5); // Higher scale for better OCR
        } else {
          // Enhanced image processing: upscaling, sharpening, contrast enhancement
          base64Data = await compressAndConvertToBase64(file);
        }
      } catch (convErr) {
        throw new Error("Failed to process file: " + String(convErr.message || "conversion error"));
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
        if (response.status === 413) {
          throw new Error("File too large. Please use a smaller image or PDF.");
        }
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
      <div className="min-h-screen bg-gray-100 font-sans">
        <Header showLogout onLogout={handleLogout} />
        <main className="mx-auto max-w-4xl px-6 py-16">
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
            <p className="text-gray-500">Loading project...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Notification
        notification={notification}
        onClose={() => setNotification(null)}
      />
      <Header showLogout onLogout={handleLogout} />

      <main className="relative mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="group mb-4 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 transition-all duration-300 hover:bg-emerald-50 hover:text-emerald-700 sm:mb-6 sm:px-4 sm:py-2 sm:text-sm"
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
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg sm:mb-8 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <h2 className="mb-2 text-xl font-bold text-gray-800 sm:text-2xl">
                {project?.name || "Project"}
              </h2>
              {project?.description && (
                <p className="text-sm text-gray-500 sm:text-base">{project.description}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="text-left sm:text-right">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1 sm:text-xs">Total Income</p>
                <p className="text-lg font-bold text-emerald-600 sm:text-xl">
                  ${totalIncome.toFixed(2)}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1 sm:text-xs">Total Expenses</p>
                <p className="text-lg font-bold text-red-600 sm:text-xl">
                  ${totalExpenses.toFixed(2)}
                </p>
              </div>
              {/* Date Range Picker */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openDateRangeModal}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
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
                    className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
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
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400 sm:mt-4 sm:gap-4 sm:text-sm">
            <span>
              Created: {formatDateEST(project?.dtm_created)} (EST)
            </span>
            <span>
              Updated: {formatDateEST(project?.dtm_modified)} (EST)
            </span>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-lg sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-gray-800 sm:text-xl">Transactions</h3>
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
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
              <span className="text-xs text-gray-500">Sort by Date:</span>
              <button
                onClick={() => setSortDirection(sortDirection === "desc" ? "asc" : "desc")}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
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
              <span className="flex items-center gap-1.5 rounded-md bg-red-50 border border-red-100 px-2 py-1 text-red-600">
                <span className="font-medium">Expenses:</span>
                <span className="font-bold">{filteredTransactions.filter(t => t.type === "Expense").length}</span>
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-100 px-2 py-1 text-emerald-600">
                <span className="font-medium">Income:</span>
                <span className="font-bold">{filteredTransactions.filter(t => t.type === "Income").length}</span>
              </span>
            </div>
          </div>

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

      {/* Processing Overlay - At root level for proper viewport centering */}
      {(isProcessingReceipt || isBulkDeleting) && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-sm">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl">
            <div className="flex flex-col items-center">
              <div className={`h-12 w-12 animate-spin rounded-full border-4 border-t-transparent ${isBulkDeleting ? "border-red-500" : "border-emerald-500"}`}></div>
              <p className={`mt-4 text-lg font-medium ${isBulkDeleting ? "text-red-600" : "text-emerald-600"}`}>
                {isBulkDeleting ? "Deleting transactions..." : "Processing receipt..."}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {isBulkDeleting ? `Removing ${selectedTransactionIds.length} item(s)` : "Analyzing receipt..."}
              </p>
              {!isBulkDeleting && (
                <p className="mt-4 text-xs text-gray-400">
                  This may take 15-30 seconds
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
