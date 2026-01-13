"use client";

export default function DateInput({
  id,
  name,
  value,
  onChange,
  required = false,
  className = "",
  size = "default", // "default" or "small"
}) {
  const baseClasses = size === "small"
    ? "date-input-modern date-input-small rounded-lg border pl-3 pr-9 py-2 text-sm transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
    : "date-input-modern rounded-lg border pl-4 pr-12 py-3 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        name={name}
        type="date"
        value={value}
        onChange={onChange}
        required={required}
        className={`${baseClasses} w-full cursor-pointer`}
        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
      />
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg
          className={`${size === "small" ? "h-4 w-4" : "h-5 w-5"}`}
          style={{ color: 'var(--accent-light)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    </div>
  );
}
