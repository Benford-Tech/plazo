import { describe, expect, it } from "vitest";
import { blogBlocks, blogDate, relatedGuides } from "@/lib/blog";

describe("blog (26/11/2026)", () => {
  it("reads the body: headings, lists, paragraphs", () => {
    expect(blogBlocks("## Quand réserver ?\n\nTôt,\nde préférence.\n\n- Comparez\n- Réservez")).toEqual([
      { kind: "h2", text: "Quand réserver ?" },
      { kind: "p", text: "Tôt, de préférence." },
      { kind: "list", items: ["Comparez", "Réservez"] },
    ]);
  });

  it("links the known guides only, and dates in Paris", () => {
    expect(relatedGuides(["parking-longue-duree", "inconnu"])).toEqual([
      { href: "/lyon-saint-exupery/guide/parking-longue-duree", short: "Parking longue durée" },
    ]);
    expect(blogDate("2026-11-26T23:30:00.000Z")).toBe("27 novembre 2026");
  });
});
