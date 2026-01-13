"use client";

export default function AnalyzeButton({ onClick, disabled = false }) {
  return (
    <button
      type="button"
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
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <span>Analyze</span>
    </button>
  );
}
