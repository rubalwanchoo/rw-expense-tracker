"use client";

export default function AddTransactionButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25"
    >
      Add Transaction
    </button>
  );
}
