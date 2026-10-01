import { bookableCapacity, can } from "@/lib/roles";

describe("rôles et capacité", () => {
  it("seul le gérant gère le parking et l'équipe", () => {
    expect(can("manager", "team:manage")).toBe(true);
    expect(can("driver", "team:manage")).toBe(false);
    expect(can("agent", "parking:manage")).toBe(false);
    expect(can(undefined, "dashboard:view")).toBe(false);
  });

  it("calcule l'aperçu comme le serveur", () => {
    expect(bookableCapacity(320, 5)).toBe(304);
    expect(bookableCapacity(73, 5)).toBe(69);
    expect(bookableCapacity(100, 80)).toBeNull();
    expect(bookableCapacity(0, 5)).toBeNull();
  });
});
