"use client";

export default function AddTransactionButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="whitespace-nowrap rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-xs font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 sm:px-4 sm:text-sm"
    >
      <span className="hidden sm:inline">Add Transaction</span>
      <span className="sm:hidden">+ Add</span>
    </button>
  );
}
