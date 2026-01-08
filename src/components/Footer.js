"use client";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 sm:py-4">
        <p className="text-center text-xs text-slate-500 sm:text-sm">
          © {currentYear} by rw
        </p>
      </div>
    </footer>
  );
}
