"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// App icon stays with header and fades out once the main content (table) scrolls into view.
export default function AppIcon() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Hide once user scrolls past ~180px (header + spacing)
      setVisible(window.scrollY < 180);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`fixed right-4 top-2 z-40 md:right-8 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6 pointer-events-none"
      }`}
    >
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

