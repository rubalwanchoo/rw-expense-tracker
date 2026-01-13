"use client";

import { getESTYear } from "@/lib/dateUtils";

// Format build timestamp to EST
const formatBuildTime = (isoString) => {
  if (!isoString) return "Unknown";
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }) + " EST";
  } catch {
    return "Unknown";
  }
};

export default function Footer() {
  const currentYear = getESTYear();
  const buildTime = formatBuildTime(process.env.NEXT_PUBLIC_BUILD_TIMESTAMP);

  return (
    <footer className="border-t transition-colors duration-300" style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--header-border)' }}>
      <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col items-center justify-between gap-1 sm:flex-row">
          <p className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
            © {currentYear} by rw
          </p>
          <p className="text-[10px] sm:text-xs" style={{ color: 'var(--muted-light)' }}>
            Version built at: {buildTime}
          </p>
        </div>
      </div>
    </footer>
  );
}
