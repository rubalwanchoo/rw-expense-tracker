"use client";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl px-6 py-4">
        <p className="text-center text-sm text-slate-500">
          © {currentYear} by rw
        </p>
      </div>
    </footer>
  );
}
