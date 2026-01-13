"use client";

import { getESTYear } from "@/lib/dateUtils";

export default function Footer() {
  const currentYear = getESTYear();

  return (
    <footer className="border-t transition-colors duration-300" style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--header-border)' }}>
      <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 sm:py-4">
        <p className="text-center text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
          © {currentYear} by rw
        </p>
      </div>
    </footer>
  );
}
