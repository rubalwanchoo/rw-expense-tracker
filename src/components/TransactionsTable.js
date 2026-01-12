"use client";

// Category color mapping
const CATEGORY_COLORS = {
  Groceries: "bg-green-100 text-green-700 border-green-200",
  Dining: "bg-orange-100 text-orange-700 border-orange-200",
  Gas: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Shopping: "bg-pink-100 text-pink-700 border-pink-200",
  Entertainment: "bg-purple-100 text-purple-700 border-purple-200",
  Travel: "bg-blue-100 text-blue-700 border-blue-200",
  Utilities: "bg-cyan-100 text-cyan-700 border-cyan-200",
  Healthcare: "bg-rose-100 text-rose-700 border-rose-200",
  Other: "bg-gray-100 text-gray-600 border-gray-200",
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

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
        {loading ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
            <p className="text-sm text-gray-500">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8">
            <svg
              className="h-10 w-10 text-gray-300"
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
            <p className="text-sm text-gray-500">No transactions yet</p>
            <p className="text-xs text-gray-400">
              Click &quot;Add Transaction&quot; to record your first expense
            </p>
          </div>
        ) : (
          <div>
            {/* Select All Header */}
            {onSelectionChange && (
              <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-3 py-2 sm:px-4">
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
                      ? "border-emerald-500 bg-emerald-100 text-emerald-600"
                      : "border-gray-300 bg-white text-transparent"
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
                <span className="text-xs font-medium text-gray-500">
                  {selectedIds.length > 0 
                    ? `${selectedIds.length} selected` 
                    : "Select all"}
                </span>
              </div>
            )}
            {transactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className={`flex items-center gap-3 px-3 py-3 transition-all duration-200 hover:bg-gray-50 sm:px-4 ${
                  index !== transactions.length - 1 ? "border-b border-gray-100" : ""
                } ${selectedIds.includes(transaction.id) ? "bg-emerald-50" : ""}`}
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
                        : "border-gray-300 bg-white text-transparent"
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
                        transaction.type === "Income"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : transaction.type === "Expense"
                          ? "bg-red-50 text-red-600 border-red-100"
                          : "bg-gray-50 text-gray-600 border-gray-100"
                      }`}
                    >
                      {transaction.type || "N/A"}
                    </span>
                    <span
                      className={`text-base font-bold ${
                        transaction.type === "Income"
                          ? "text-emerald-600"
                          : transaction.type === "Expense"
                          ? "text-red-600"
                          : "text-gray-800"
                      }`}
                    >
                      {transaction.amount != null
                        ? `$${parseFloat(transaction.amount).toFixed(2)}`
                        : "-"}
                    </span>
                  </div>
                  {/* Description */}
                  <p className="text-xs text-gray-600 line-clamp-1">
                    {transaction.description || "No description"}
                  </p>
                  {/* Source */}
                  <p className="text-[10px] text-gray-400">
                    Source: {transaction.source || "-"}
                  </p>
                  {/* Date */}
                  <p className="text-[10px] text-gray-400">
                    Date: {transaction.trans_date || "-"}
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
                    className="group rounded-md p-1.5 text-blue-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="group rounded-md p-1.5 text-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
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
        )}
      </div>
    </div>
  );
}
