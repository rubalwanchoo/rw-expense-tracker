"use client";

import { useMemo } from "react";

// Category color mapping with dark mode support
// Light theme: transparent background, matching text/border colors
const CATEGORY_COLORS = {
  Payment: "bg-transparent text-emerald-600 border-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-400",
  Groceries: "bg-transparent text-green-600 border-green-600 dark:bg-green-900/40 dark:text-green-400 dark:border-green-400",
  Dining: "bg-transparent text-orange-600 border-orange-600 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-400",
  Gas: "bg-transparent text-yellow-600 border-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-400",
  Shopping: "bg-transparent text-pink-600 border-pink-600 dark:bg-pink-900/40 dark:text-pink-400 dark:border-pink-400",
  Entertainment: "bg-transparent text-purple-600 border-purple-600 dark:bg-purple-900/40 dark:text-purple-400 dark:border-purple-400",
  Travel: "bg-transparent text-blue-600 border-blue-600 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-400",
  Utilities: "bg-transparent text-cyan-600 border-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400 dark:border-cyan-400",
  Healthcare: "bg-transparent text-rose-600 border-rose-600 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-400",
  Other: "bg-transparent text-gray-600 border-gray-600 dark:bg-gray-700/40 dark:text-gray-400 dark:border-gray-400",
};

// Month abbreviations
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// Format date as "MON-DD-YY" (e.g., "JAN-15-25")
const formatDateHeader = (dateStr) => {
  if (!dateStr) return "No Date";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parts[0].slice(-2); // Last 2 digits of year
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parts[2];
  return `${MONTHS[month]}-${day}-${year}`;
};

export default function TransactionsTable({
  transactions,
  loading,
  onEdit,
  onDelete,
  disabled = false,
  selectedIds = [],
  onSelectionChange,
}) {
  // Handle individual checkbox toggle
  const handleCheckboxChange = (transactionId) => {
    if (!onSelectionChange) return;
    
    if (selectedIds.includes(transactionId)) {
      onSelectionChange(selectedIds.filter(id => id !== transactionId));
    } else {
      onSelectionChange([...selectedIds, transactionId]);
    }
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (selectedIds.length === transactions.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(transactions.map(t => t.id));
    }
  };

  const isAllSelected = transactions.length > 0 && selectedIds.length === transactions.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < transactions.length;

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups = {};
    transactions.forEach((t) => {
      const dateKey = t.trans_date || "no-date";
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });
    
    // Convert to array of [date, transactions[]] and sort by date descending
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [transactions]);

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-xl border shadow-lg transition-colors duration-300" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        {loading ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8">
            <svg
              className="h-10 w-10"
              style={{ color: 'var(--muted-light)' }}
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
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No transactions yet</p>
            <p className="text-xs" style={{ color: 'var(--muted-light)' }}>
              Click &quot;Add Transaction&quot; to record your first expense
            </p>
          </div>
        ) : (
          <div>
            {/* Select All Header */}
            {onSelectionChange && (
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-3 py-2 sm:px-4">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  disabled={disabled}
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-all duration-200 ${
                    disabled 
                      ? "cursor-not-allowed opacity-50" 
                      : "cursor-pointer hover:border-emerald-500"
                  } ${
                    isAllSelected
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : isSomeSelected
                      ? "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-transparent"
                  }`}
                >
                  {isAllSelected ? (
                    <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isSomeSelected ? (
                    <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="4" y="10" width="16" height="4" rx="1" />
                    </svg>
                  ) : null}
                </button>
                <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                  {selectedIds.length > 0 
                    ? `${selectedIds.length} selected` 
                    : "Select all"}
                </span>
              </div>
            )}
            {groupedTransactions.map(([dateKey, dateTransactions], groupIndex) => {
              // Calculate total expenses for this date
              const dayTotalExpenses = dateTransactions
                .filter(t => t.type === "Expense")
                .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
              
              // Calculate total payments for this date
              const dayTotalPayments = dateTransactions
                .filter(t => t.type === "Payment")
                .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
              
              return (
              <div key={dateKey}>
                {/* Date Header Row */}
                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 px-3 py-2 sm:px-4 border-b border-blue-200 dark:border-blue-600">
                  <svg className="h-4 w-4 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-bold tracking-wide text-blue-800 dark:text-blue-300">
                    {formatDateHeader(dateKey)}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    {/* Total Payments for this day */}
                    {dayTotalPayments > 0 && (
                      <span 
                        className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-transparent dark:bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-600 dark:border-emerald-400"
                        title="Total Payments"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        ${dayTotalPayments.toFixed(2)}
                      </span>
                    )}
                    {/* Total Expenses for this day */}
                    {dayTotalExpenses > 0 && (
                      <span 
                        className="flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400 bg-transparent dark:bg-red-900/30 px-2 py-0.5 rounded-full border border-red-600 dark:border-red-400"
                        title="Total Expenses"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ${dayTotalExpenses.toFixed(2)}
                      </span>
                    )}
                    {/* Item count */}
                    <span className="text-[10px] font-medium text-blue-500 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                      {dateTransactions.length} item{dateTransactions.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                
                {/* Transactions for this date */}
                {dateTransactions.map((transaction, index) => (
                  <div
                    key={transaction.id}
                    className={`flex items-center gap-3 px-3 py-3 sm:px-4 ${
                      index !== dateTransactions.length - 1 || groupIndex !== groupedTransactions.length - 1 
                        ? "border-b border-gray-100 dark:border-slate-700" 
                        : ""
                    } ${selectedIds.includes(transaction.id) ? "bg-emerald-50 dark:bg-emerald-900/20" : ""}`}
                  >
                    {/* Checkbox */}
                    {onSelectionChange && (
                      <button
                        type="button"
                        onClick={() => handleCheckboxChange(transaction.id)}
                        disabled={disabled}
                        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-all duration-200 ${
                          disabled 
                            ? "cursor-not-allowed opacity-50" 
                            : "cursor-pointer hover:border-emerald-500"
                        } ${
                          selectedIds.includes(transaction.id)
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-transparent"
                        }`}
                      >
                        {selectedIds.includes(transaction.id) && (
                          <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    )}
                    
                    {/* Transaction Info - Stacked, Left Aligned */}
                    <div className="flex-1 space-y-0.5 text-left">
                      {/* Type Badge + Amount */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                            transaction.type === "Payment"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700"
                              : transaction.type === "Expense"
                              ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700"
                              : "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-700/30 dark:text-gray-400 dark:border-gray-600"
                          }`}
                        >
                          {transaction.type || "N/A"}
                        </span>
                        <span
                          className={`text-base font-bold ${
                            transaction.type === "Payment"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : transaction.type === "Expense"
                              ? "text-red-600 dark:text-red-400"
                              : ""
                          }`}
                          style={{ color: transaction.type !== "Payment" && transaction.type !== "Expense" ? 'var(--foreground)' : undefined }}
                        >
                          {transaction.amount != null
                            ? `$${parseFloat(transaction.amount).toFixed(2)}`
                            : "-"}
                        </span>
                      </div>
                      {/* Description */}
                      <p className="text-xs line-clamp-1" style={{ color: 'var(--muted)' }}>
                        {transaction.description || "No description"}
                      </p>
                      {/* Source */}
                      <p className="text-[10px]" style={{ color: 'var(--muted-light)' }}>
                        Source: {transaction.source || "-"}
                      </p>
                      {/* Category Badge */}
                      {transaction.category && (
                        <span
                          className={`mt-1 inline-block text-[9px] font-medium px-2 py-0.5 rounded-full border ${
                            CATEGORY_COLORS[transaction.category] || CATEGORY_COLORS.Other
                          }`}
                        >
                          {transaction.category}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        className="group rounded-md p-1.5 text-blue-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Edit"
                        onClick={() => onEdit(transaction)}
                        disabled={disabled}
                      >
                        <svg
                          className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
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
                        className="group rounded-md p-1.5 text-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Delete"
                        onClick={() => onDelete(transaction)}
                        disabled={disabled}
                      >
                        <svg
                          className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
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
                  </div>
                ))}
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
