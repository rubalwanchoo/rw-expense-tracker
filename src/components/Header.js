"use client";

import Image from "next/image";

export default function Header({ showLogout = false, onLogout, showAppIcon = false }) {
  return (
    <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            rw-expense-tracker
          </span>
        </h1>
        <div className="flex items-center gap-4">
          {showLogout && (
            <button
              onClick={onLogout}
              className="rounded-md px-3 py-1.5 text-sm font-semibold text-emerald-300 transition-all duration-300 hover:scale-105 hover:bg-emerald-500/20 hover:text-emerald-200 hover:shadow-[0_0_12px_rgba(16,185,129,0.4)] active:scale-100"
            >
              Logout
            </button>
          )}
          {showAppIcon && (
            <Image
              src="/app-icon.png"
              alt="Expense Tracker"
              width={90}
              height={90}
              priority
              unoptimized
              className="cursor-pointer drop-shadow-lg transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            />
          )}
        </div>
      </div>
    </header>
  );
}

