import { describe, expect, it } from "vitest";
import { childSeatsFromValues, childSeatsProblem, childSeatsSummary, childSeatsToValues, hasChildSeats, parseChildSeatCount } from "../child-seats";

describe("child seats for the shuttle (direction B « par âge »)", () => {
  it("sums up the seats asked, singular and plural, in the age order", () => {
    expect(childSeatsSummary({ infant: 1, toddler: 0, booster: 2 })).toBe("1 siège bébé · 2 réhausseurs");
    expect(childSeatsSummary({ infant: 2, toddler: 1, booster: 1 })).toBe("2 sièges bébé · 1 siège 1 à 4 ans · 1 réhausseur");
    expect(childSeatsSummary({ infant: 0, toddler: 3, booster: 0 }, ", ")).toBe("3 sièges 1 à 4 ans");
    expect(childSeatsSummary({ infant: 0, toddler: 0, booster: 0 })).toBe("");
    expect(childSeatsSummary(undefined)).toBe("");
    expect(hasChildSeats({ infant: 0, toddler: 0, booster: 1 })).toBe(true);
    expect(hasChildSeats(null)).toBe(false);
  });

  it("wants fewer seats than passengers: the children count in the passengers", () => {
    expect(childSeatsProblem({ infant: 1, toddler: 0, booster: 0 }, 1)).toBe("child_seats_exceed_passengers");
    expect(childSeatsProblem({ infant: 1, toddler: 1, booster: 0 }, 2)).toBe("child_seats_exceed_passengers");
    expect(childSeatsProblem({ infant: 1, toddler: 1, booster: 0 }, 3)).toBeNull();
    expect(childSeatsProblem({ infant: 0, toddler: 0, booster: 0 }, 1)).toBeNull();
  });

  it("reads the form's counts, anything out of 0 to 4 counting as none", () => {
    expect(parseChildSeatCount("2")).toBe(2);
    expect(parseChildSeatCount(" 4 ")).toBe(4);
    expect(parseChildSeatCount("5")).toBe(0);
    expect(parseChildSeatCount("-1")).toBe(0);
    expect(parseChildSeatCount("x")).toBe(0);
    expect(parseChildSeatCount(undefined)).toBe(0);
    expect(childSeatsFromValues({ childSeatsInfant: "1", childSeatsBooster: "2" })).toEqual({ infant: 1, toddler: 0, booster: 2 });
    expect(childSeatsFromValues({})).toEqual({ infant: 0, toddler: 0, booster: 0 });
  });

  it("writes a booking's seats back as form values", () => {
    expect(childSeatsToValues({ infant: 0, toddler: 1, booster: 0 })).toEqual({ childSeatsInfant: "0", childSeatsToddler: "1", childSeatsBooster: "0" });
    expect(childSeatsToValues(undefined)).toEqual({ childSeatsInfant: "0", childSeatsToddler: "0", childSeatsBooster: "0" });
  });
});
