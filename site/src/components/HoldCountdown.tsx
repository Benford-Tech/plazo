"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fr } from "@/lib/fr";

/** 1785 -> "29:45" */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * "Votre place est réservée pendant mm:ss". The server renders the time left (static text without
 * JavaScript); the browser counts down from it (never from its own clock, which may be wrong), then
 * reloads the page once the hold is over (it then shows "Le délai est dépassé").
 * Boutique: an amber box (waiting for payment), the countdown in the mono face of the hours.
 */
export function HoldCountdown({ secondsLeft }: { secondsLeft: number }) {
  const router = useRouter();
  const [left, setLeft] = useState(secondsLeft);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const next = secondsLeft - Math.floor((Date.now() - start) / 1000);
      setLeft(next);
      if (next <= 0) {
        clearInterval(timer);
        // A second of margin: the API then reads the hold as over.
        setTimeout(() => router.refresh(), 1500);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, router]);

  return (
    <p className="flex items-center gap-2.5 rounded-field bg-warn-bg px-3.5 py-3 text-[14.5px] font-semibold text-warn">
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
      <span>
        {fr.pay.holdLeft("")}
        <span role="timer" className="font-hour text-[15.5px] text-ink">
          {formatCountdown(left)}
        </span>
      </span>
    </p>
  );
}
