import { childSeatBadge, childSeatsLoadLine, childSeatsSummary, childSeatsTotal, hasChildSeats, sameChildSeats, sumChildSeats } from "./child-seats";

describe("sièges auto (24/10/2026, direction B « par âge »)", () => {
  it("compte les sièges et dit s'il y en a", () => {
    expect(childSeatsTotal({ infant: 1, toddler: 0, booster: 2 })).toBe(3);
    expect(childSeatsTotal(null)).toBe(0);
    expect(hasChildSeats({ infant: 0, toddler: 0, booster: 0 })).toBe(false);
    expect(hasChildSeats({ infant: 0, toddler: 1, booster: 0 })).toBe(true);
  });

  it("résume « 1 siège bébé · 2 réhausseurs », au pluriel quand il faut", () => {
    expect(childSeatsSummary({ infant: 1, toddler: 0, booster: 2 })).toBe("1 siège bébé · 2 réhausseurs");
    expect(childSeatsSummary({ infant: 2, toddler: 2, booster: 0 })).toBe("2 sièges bébé · 2 sièges 1 à 4 ans");
    expect(childSeatsSummary({ infant: 0, toddler: 0, booster: 0 })).toBe("");
    expect(childSeatsSummary(undefined)).toBe("");
  });

  it("la pastille du chauffeur nomme le siège, ou en compte plusieurs", () => {
    expect(childSeatBadge("infant", 1)).toBe("Siège bébé");
    expect(childSeatBadge("toddler", 1)).toBe("Siège 1 à 4 ans");
    expect(childSeatBadge("booster", 1)).toBe("Réhausseur");
    expect(childSeatBadge("booster", 2)).toBe("2 réhausseurs");
  });

  it("additionne les sièges des personnes cochées et donne la ligne à charger", () => {
    const sum = sumChildSeats([{ infant: 1, toddler: 0, booster: 0 }, null, { infant: 0, toddler: 1, booster: 1 }, undefined]);
    expect(sum).toEqual({ infant: 1, toddler: 1, booster: 1 });
    expect(childSeatsLoadLine(sum)).toBe("1 siège bébé (dos à la route) · 1 siège 1 à 4 ans · 1 réhausseur");
    expect(childSeatsLoadLine({ infant: 2, toddler: 0, booster: 3 })).toBe("2 sièges bébé (dos à la route) · 3 réhausseurs");
    expect(childSeatsLoadLine(null)).toBe("");
  });

  it("compare deux demandes, l'absence valant zéro", () => {
    expect(sameChildSeats(null, { infant: 0, toddler: 0, booster: 0 })).toBe(true);
    expect(sameChildSeats({ infant: 1, toddler: 0, booster: 0 }, { infant: 0, toddler: 0, booster: 0 })).toBe(false);
  });
});
