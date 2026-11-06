"use client";

import { useEffect } from "react";
import { ACQUISITION_COOKIE, classifyVisit, encodeAcquisition } from "@/lib/acquisition";

/**
 * SEO local, measurement (06/11/2026): on the first page of a visit, where it came from is kept in a session cookie (read by
 * the booking) and counted once by the API. Nothing on Plazo Pro's pages; nothing else about the visitor.
 */
export function VisitTracker() {
  useEffect(() => {
    try {
      if (document.cookie.split("; ").some(c => c.startsWith(`${ACQUISITION_COOKIE}=`))) return;
      if (document.querySelector("[data-pro-site]") || location.pathname.startsWith("/loueurs")) return;
      const visit = classifyVisit(location.href, document.referrer, location.hostname);
      const secure = location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${ACQUISITION_COOKIE}=${encodeAcquisition(visit)}; Path=/; SameSite=Lax${secure}`;
      const body = JSON.stringify(visit);
      const sent = navigator.sendBeacon?.("/api/public/visits", new Blob([body], { type: "application/json" }));
      if (!sent) void fetch("/api/public/visits", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
    } catch {
      // Measurement never breaks a page.
    }
  }, []);
  return null;
}
