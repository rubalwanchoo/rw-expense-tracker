"use client";

export default function AddTransactionButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-40 items-center justify-center gap-2 rounded-lg border-2 text-sm font-bold transition-all hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap dark:bg-emerald-900/30"
      style={{ 
        backgroundColor: 'transparent', 
        color: '#059669', 
        borderColor: '#059669' 
      }}
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
          d="M12 4v16m8-8H4"
        />
      </svg>
      <span>Add Transaction</span>
    </button>
  );
}
