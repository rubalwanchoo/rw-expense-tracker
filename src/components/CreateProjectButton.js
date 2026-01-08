"use client";

export default function CreateProjectButton({ onClick }) {
  return (
    <button
      className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-100 sm:px-8 sm:py-4 sm:text-lg"
      onClick={onClick}
    >
      <svg
        className="h-4 w-4 transition-transform group-hover:scale-110 sm:h-5 sm:w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        />
      </svg>
      <span className="hidden sm:inline">Create tracker project</span>
      <span className="sm:hidden">New Project</span>
    </button>
  );
}

