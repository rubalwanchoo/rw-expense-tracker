"use client";

import Image from "next/image";

// App icon positioned at the top right of the body/main content area.
export default function AppIcon() {
  return (
    <div className="absolute right-0 top-0 z-10">
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

