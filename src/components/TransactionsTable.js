"use client";

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
      <div className="overflow-hidden rounded-lg border-2 border-slate-600 bg-slate-800/70 shadow-lg">
        {loading ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"></div>
            <p className="text-sm text-slate-400">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8">
            <svg
              className="h-10 w-10 text-slate-600"
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
            <p className="text-sm text-slate-400">No transactions yet</p>
            <p className="text-xs text-slate-500">
              Click &quot;Add Transaction&quot; to record your first expense
            </p>
          </div>
        ) : (
          <div>
            {/* Select All Header */}
            {onSelectionChange && (
              <div className="flex items-center gap-3 border-b-2 border-slate-600 bg-slate-700/30 px-3 py-2 sm:px-4">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  disabled={disabled}
                  className={`flex h-2.5 w-2.5 flex-shrink-0 items-center justify-center rounded-sm border transition-all duration-200 ${
                    disabled 
                      ? "cursor-not-allowed opacity-50" 
                      : "cursor-pointer hover:border-emerald-400"
                  } ${
                    isAllSelected
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                      : isSomeSelected
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-slate-500 bg-slate-700/50 text-transparent"
                  }`}
                >
                  {isAllSelected ? (
                    <svg className="h-1.5 w-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isSomeSelected ? (
                    <svg className="h-1.5 w-1.5" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="2" y="9" width="20" height="6" rx="1" />
                    </svg>
                  ) : null}
                </button>
                <span className="text-xs font-medium text-slate-400">
                  {selectedIds.length > 0 
                    ? `${selectedIds.length} selected` 
                    : "Select all"}
                </span>
              </div>
            )}
            {transactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className={`flex items-center gap-3 px-3 py-3 transition-all duration-200 hover:bg-slate-700/50 sm:px-4 ${
                  index !== transactions.length - 1 ? "border-b-2 border-slate-600" : ""
                } ${selectedIds.includes(transaction.id) ? "bg-emerald-500/10" : ""}`}
              >
                {/* Checkbox */}
                {onSelectionChange && (
                  <button
                    type="button"
                    onClick={() => handleCheckboxChange(transaction.id)}
                    disabled={disabled}
                    className={`flex h-2.5 w-2.5 flex-shrink-0 items-center justify-center rounded-sm border transition-all duration-200 ${
                      disabled 
                        ? "cursor-not-allowed opacity-50" 
                        : "cursor-pointer hover:border-emerald-400"
                    } ${
                      selectedIds.includes(transaction.id)
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                        : "border-slate-500 bg-slate-700/50 text-transparent"
                    }`}
                  >
                    {selectedIds.includes(transaction.id) && (
                      <svg className="h-1.5 w-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )}
                
                {/* Transaction Info - Stacked, Left Aligned */}
                <div className="flex-1 space-y-0.5 text-left">
                  {/* Type Badge + Amount */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                        transaction.type === "Income"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : transaction.type === "Expense"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-slate-500/20 text-slate-400"
                      }`}
                    >
                      {transaction.type || "N/A"}
                    </span>
                    <span
                      className={`text-base font-bold ${
                        transaction.type === "Income"
                          ? "text-emerald-400"
                          : transaction.type === "Expense"
                          ? "text-red-400"
                          : "text-white"
                      }`}
                    >
                      {transaction.amount != null
                        ? `$${parseFloat(transaction.amount).toFixed(2)}`
                        : "-"}
                    </span>
                  </div>
                  {/* Description */}
                  <p className="text-xs text-slate-300 line-clamp-1">
                    {transaction.description || "No description"}
                  </p>
                  {/* Source */}
                  <p className="text-[10px] text-slate-500">
                    Source: {transaction.source || "-"}
                  </p>
                  {/* Date */}
                  <p className="text-[10px] text-slate-500">
                    Date: {transaction.trans_date || "-"}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    className="group rounded-md p-1.5 text-blue-500 transition-all duration-200 hover:bg-blue-500/20 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="group rounded-md p-1.5 text-red-500 transition-all duration-200 hover:bg-red-500/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
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
