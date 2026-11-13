import { PLAZO_PLANS, savings, yearlyMonthly } from "./pro-plans";

describe("formules Plazo Pro (13/11/2026)", () => {
  it("99, 199 et 299 € par mois, −10 % à l'année", () => {
    expect(PLAZO_PLANS.map((p) => p.monthlyEuros)).toEqual([99, 199, 299]);
    expect(PLAZO_PLANS.map((p) => yearlyMonthly(p.monthlyEuros))).toEqual([89, 179, 269]);
    expect(PLAZO_PLANS.filter((p) => p.recommended).map((p) => p.id)).toEqual(["operations"]);
  });

  it("compte seulement la saisie et les appels évités", () => {
    const s = savings({ bookingsPerMonth: 400, minutesPerBooking: 3, callsPerDay: 15, hourlyCost: 18, planEuros: 199 });
    expect(s.hours).toBe(35);
    expect(s.value).toBe(630);
    expect(s.net).toBe(431);
    expect(s.paidBackInDays).toBe(10);
    expect(savings({ bookingsPerMonth: 0, minutesPerBooking: 1, callsPerDay: 0, hourlyCost: 18, planEuros: 99 }).paidBackInDays).toBeNull();
  });
});
