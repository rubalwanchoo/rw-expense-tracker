"use client";

import Image from "next/image";

export default function Header({ showLogout = false, onLogout, showAppIcon = false }) {
  return (
    <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <h1 className="text-lg font-bold tracking-tight text-white sm:text-2xl">
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            rw-expense-tracker
          </span>
        </h1>
        <div className="flex items-center gap-2 sm:gap-4">
          {showLogout && (
            <button
              onClick={onLogout}
              className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-300 transition-all duration-300 hover:scale-105 hover:bg-emerald-500/20 hover:text-emerald-200 hover:shadow-[0_0_12px_rgba(16,185,129,0.4)] active:scale-100 sm:px-3 sm:py-1.5 sm:text-sm"
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
              className="h-14 w-14 cursor-pointer drop-shadow-lg transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] sm:h-[90px] sm:w-[90px]"
            />
          )}
        </div>
      </div>
    </header>
  );
}

