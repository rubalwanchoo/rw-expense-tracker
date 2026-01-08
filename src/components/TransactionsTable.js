"use client";

export default function TransactionsTable({
  transactions,
  loading,
  sortColumn,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
}) {
  const SortIcon = ({ column }) => {
    if (sortColumn !== column) {
      return (
        <svg className="ml-1 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === "asc" ? (
      <svg className="ml-1 h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="ml-1 h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/80">
              <th
                className="cursor-pointer px-6 py-4 text-left text-sm font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
                onClick={() => onSort("trans_date")}
              >
                <div className="flex items-center">
                  Date
                  <SortIcon column="trans_date" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-4 text-left text-sm font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
                onClick={() => onSort("amount")}
              >
                <div className="flex items-center">
                  Amount
                  <SortIcon column="amount" />
                </div>
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
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"></div>
                    <p className="text-slate-400">Loading transactions...</p>
                  </div>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
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
                    <div className="flex flex-col gap-2">
                      <span
                        className={`-mt-2 text-[10px] font-medium uppercase tracking-wide ${
                          transaction.type === "Income"
                            ? "text-emerald-400"
                            : transaction.type === "Expense"
                            ? "text-red-400"
                            : "text-slate-500"
                        }`}
                      >
                        {transaction.type || ""}
                      </span>
                      <span>{transaction.trans_date || "-"}</span>
                    </div>
                  </td>
                  <td
                    className={`px-6 py-4 text-left font-medium ${
                      transaction.type === "Income"
                        ? "text-emerald-400"
                        : transaction.type === "Expense"
                        ? "text-red-400"
                        : "text-slate-300"
                    }`}
                  >
                    {transaction.amount != null
                      ? `$${parseFloat(transaction.amount).toFixed(2)}`
                      : "-"}
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
                        onClick={() => onEdit(transaction)}
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
                        onClick={() => onDelete(transaction)}
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
  );
}
