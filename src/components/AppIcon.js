"use client";

import Image from "next/image";

export default function AppIcon() {
  return (
    <div className="fixed right-4 top-2 z-40 md:right-8">
      <Image
        src="/app-icon.png"
        alt="Expense Tracker"
        width={140}
        height={140}
        priority
        unoptimized
        className="cursor-pointer drop-shadow-2xl animate-[float_3s_ease-in-out_infinite] transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_25px_rgba(16,185,129,0.6)] active:scale-105 active:drop-shadow-[0_0_35px_rgba(16,185,129,0.8)]"
      />
    </div>
  );
}

