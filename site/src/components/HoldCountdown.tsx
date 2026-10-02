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
    <p className="text-[15px] text-soft">
      {fr.pay.holdLeft("")}
      <span role="timer" className="font-bold text-ink tabular-nums">
        {formatCountdown(left)}
      </span>
    </p>
  );
}
