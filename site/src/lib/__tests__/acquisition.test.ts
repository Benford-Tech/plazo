import { describe, expect, it } from "vitest";
import { classifyVisit, decodeAcquisition, encodeAcquisition } from "../acquisition";

const HOST = "www.plazo.fr";

describe("origine d'une visite (SEO local, 06/11/2026)", () => {
  it("reconnaît les moteurs, les réseaux, les autres sites et l'accès direct", () => {
    expect(classifyVisit("https://www.plazo.fr/", "https://www.google.fr/", HOST)).toEqual({ source: "search", detail: "google", landing: "/" });
    expect(classifyVisit("https://www.plazo.fr/x", "android-app://com.google.android.googlequicksearchbox/", HOST).detail).toBe("google");
    expect(classifyVisit("https://www.plazo.fr/x", "https://duckduckgo.com/", HOST).detail).toBe("duckduckgo");
    expect(classifyVisit("https://www.plazo.fr/x", "https://l.facebook.com/", HOST)).toMatchObject({ source: "social", detail: "facebook" });
    expect(classifyVisit("https://www.plazo.fr/x", "https://www.lyon-aeroport-blog.fr/article", HOST)).toMatchObject({ source: "referral", detail: "lyon-aeroport-blog.fr" });
    expect(classifyVisit("https://www.plazo.fr/x", "", HOST).source).toBe("direct");
    expect(classifyVisit("https://www.plazo.fr/x", "https://www.plazo.fr/y", HOST).source).toBe("direct");
  });

  it("une campagne l'emporte, sauf une campagne marquée organique", () => {
    expect(classifyVisit("https://www.plazo.fr/?utm_source=Newsletter Novembre&utm_medium=email", "https://mail.google.com/", HOST)).toMatchObject({
      source: "campaign",
      detail: "newsletter-novembre",
    });
    expect(classifyVisit("https://www.plazo.fr/?gclid=abc", "https://www.google.fr/", HOST).detail).toBe("google-ads");
    expect(classifyVisit("https://www.plazo.fr/?utm_source=google&utm_medium=organic", "https://www.google.fr/", HOST).source).toBe("search");
  });

  it("le cookie aller-retour, et rien de ce qui n'en est pas un", () => {
    const visit = { source: "search" as const, detail: "google", landing: "/lyon-saint-exupery/depuis/grenoble" };
    expect(decodeAcquisition(encodeAcquisition(visit))).toEqual(visit);
    expect(decodeAcquisition("app%7C%7C%2F")).toBeNull();
    expect(decodeAcquisition(undefined)).toBeNull();
    expect(decodeAcquisition("%E0%A4%A")).toBeNull();
  });
});
