"use client";

export default function FilterBox({ value, onChange, placeholder = "Filter projects..." }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-64 rounded-lg border border-slate-700 bg-slate-800/80 px-10 py-2 text-sm text-white placeholder-slate-500 shadow-inner shadow-slate-900/20 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
      <svg
        className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
        />
      </svg>
    </div>
  );
}

