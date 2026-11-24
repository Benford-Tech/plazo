import { describe, expect, it } from "vitest";
import type { ParkingSiteInfo } from "@/lib/types";
import { inkOn, withDraft } from "./LivePreview";

// 24/11/2026 (« Il faut un aperçu du site en cours d'édition »). Fictional data only.

const site: ParkingSiteInfo = {
  slug: "cedres",
  title: "Parking des Cèdres",
  airport: "lyon-saint-exupery",
  airportName: "Lyon Saint-Exupéry",
  parking: "p",
  accent: "#0E5FA8",
  accentInk: "#FFFFFF",
  blocks: [{ id: "booking", kind: "booking", enabled: true, title: null, text: null }],
  bookable: true,
  preview: true,
  theme: "simple",
  destinations: [{ slug: "aeroport", kind: "airport", name: "Lyon Saint-Exupéry", instructions: null }],
  pages: [],
  logoUrl: "/api/public/sites/cedres/logo?v=1",
};

describe("le brouillon de « Mon site » dans l'aperçu", () => {
  it("applique le style, les couleurs, les blocs allumés et les pages ; garde le reste", () => {
    const next = withDraft(site, {
      theme: "valet",
      accent: "#F2B705",
      accent2: "#0E2238",
      blocks: [
        { id: "booking", kind: "booking", enabled: true, title: "Réservez", text: null },
        { id: "faq", kind: "faq", enabled: false, title: null, text: null },
      ],
      pages: true,
      showLogo: false,
      rating: { value: 4.8, count: 12 },
    });
    expect(next).toMatchObject({
      theme: "valet",
      accent: "#F2B705",
      accentInk: "#1A1D1A",
      accent2: "#0E2238",
      accent2Ink: "#FFFFFF",
      blocks: [{ id: "booking", kind: "booking", enabled: true, title: "Réservez", text: null }],
      pages: ["aeroport", "tarifs", "questions", "contact", "mentions-legales"],
      logoUrl: null,
      rating: { value: 4.8, count: 12 },
      title: "Parking des Cèdres",
    });
  });

  it("écarte une couleur ou une photo mal formée", () => {
    const next = withDraft(site, { accent: "red", heroPhotoUrl: "https://ailleurs.example/x.jpeg" });
    expect(next.accent).toBe("#0E5FA8");
    expect(next.heroPhotoUrl).toBeUndefined();
    expect(withDraft(site, { heroPhotoUrl: "/api/public/sites/cedres/hero/0123456789abcdef01.jpeg" }).heroPhotoUrl).toBe(
      "/api/public/sites/cedres/hero/0123456789abcdef01.jpeg",
    );
    expect(inkOn("#FFFFFF")).toBe("#1A1D1A");
  });
});
