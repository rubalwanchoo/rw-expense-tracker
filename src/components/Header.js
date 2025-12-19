"use client";

export default function Header() {
  return (
    <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl px-6 py-5">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            rw-expense-tracker
          </span>
        </h1>
      </div>
    </header>
  );
}

