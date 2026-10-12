import { describe, expect, it } from "vitest";
import { SHUTTLE_COLOURS, bearing, shuttleMarkerHtml, shuttleTone, shuttleTransform } from "../shuttle-icon";

describe("shuttle pictogram (I-C, Boutique)", () => {
  it("draws every tone from the tokens, never a hard-coded colour", () => {
    expect(SHUTTLE_COLOURS).toEqual({
      terminal: "var(--color-accent)",
      airport: "var(--color-ok)",
      unknown: "var(--color-soft)",
      plain: "var(--color-ink)",
    });
    const html = shuttleMarkerHtml("airport", 45);
    expect(html).not.toMatch(/#[0-9a-f]{3,6}\b|rgba?\(/i);
    expect(html).toContain("var(--shadow-pin)");
    expect(html).toContain("width:30px");
  });

  it("colours by direction and turns the bus the way it drives", () => {
    expect(shuttleTone("dropoff", true)).toBe("terminal");
    expect(shuttleTone("pickup", true)).toBe("airport");
    expect(shuttleTone("pickup", false)).toBe("unknown");
    expect(shuttleTransform(null)).toBe("");
    expect(shuttleTransform(90)).toBe("rotate(0deg)");
    expect(shuttleTransform(270)).toBe("scaleX(-1) rotate(0deg)");
    expect(bearing({ lat: 45.7, lng: 5 }, { lat: 45.7, lng: 5.00001 })).toBeNull();
  });
});
