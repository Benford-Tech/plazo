import { describe, expect, it } from "vitest";
import { parkingFaq, priceRows } from "../parking-more";
import type { ParkingResponse } from "../types";

const data = (over: Partial<ParkingResponse["parking"]> = {}, code = "LYS"): Pick<ParkingResponse, "airport" | "parking"> => ({
  airport: { code, name: "Lyon Saint-Exupéry", slug: "lyon-saint-exupery" },
  parking: {
    slug: "p",
    title: "Parking des Cèdres",
    services: ["shuttle", "open_24h"],
    shuttleMinutes: 5,
    shuttleWaitMinutes: 10,
    distanceKm: 5,
    openingHours: null,
    cancellationPolicy: "free_24h",
    photo: null,
    payment: "online",
    description: null,
    photos: [],
    address: null,
    pricing: { tiers: [{ days: 7, priceCents: 5900 }, { days: 1, priceCents: 1200 }], extraDayPriceCents: 600 },
    ...over,
  },
});

describe("B · fiche parking enrichie", () => {
  it("lists the price grid shortest first", () => {
    expect(priceRows(data().parking.pricing).map(r => r.days)).toEqual([1, 7]);
  });

  it("answers only from the parking's data", () => {
    const faq = parkingFaq(data());
    expect(faq.map(([q]) => q)).toEqual([
      "Combien de temps dure la navette jusqu’au terminal ?",
      "Le parking est-il ouvert la nuit ?",
      "Dois-je laisser mes clés ?",
      "Que se passe-t-il si mon vol retour a du retard ?",
      "Puis-je annuler ma réservation ?",
      "Faut-il payer au parking ?",
    ]);
    expect(faq[0][1]).toBe("La navette gratuite vous dépose au Terminal 1 en 5 minutes, après 10 min d’attente en moyenne.");
    expect(faq[2][1]).toContain("gardez vos clés");
  });

  it("leaves out what the parking never said", () => {
    const faq = parkingFaq(data({ services: ["valet"], shuttleMinutes: null, payment: "unavailable" }, "CDG"));
    expect(faq.map(([q]) => q)).toEqual(["Dois-je laisser mes clés ?", "Puis-je annuler ma réservation ?"]);
    expect(faq[0][1]).toContain("voiturier");
  });

  it("gives the opening hours when the parking is not open all day", () => {
    const faq = parkingFaq(data({ services: [], openingHours: "5h – 23h" }));
    expect(faq.find(([q]) => q.includes("nuit"))?.[1]).toBe("Le parking est ouvert : 5h – 23h.");
  });
});
