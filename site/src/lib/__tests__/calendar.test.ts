import { describe, expect, it } from "vitest";
import {
  addMonths,
  dayState,
  formatDayLong,
  isDisabled,
  monthTitle,
  monthWeeks,
  moveFocus,
  pickDay,
  rangeDays,
  rangeSummary,
  TIME_SLOTS,
  timeOptions,
  viewFor,
  WEEKDAY_INITIALS,
  type RangeDraft,
} from "../calendar";

const MIN = "2026-10-02";
const empty: RangeDraft = { start: null, end: null, picking: "start" };

describe("calendar grid", () => {
  it("starts weeks on Monday with French initials", () => {
    expect(WEEKDAY_INITIALS).toEqual(["lu", "ma", "me", "je", "ve", "sa", "di"]);
    const weeks = monthWeeks("2026-10");
    // 1 October 2026 is a Thursday: three empty cells first.
    expect(weeks[0]).toEqual([null, null, null, "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
    expect(weeks.every(w => w.length === 7)).toBe(true);
    // November 2026 starts on a Sunday.
    expect(monthWeeks("2026-11")[0].slice(5)).toEqual([null, "2026-11-01"]);
  });

  it("labels months and days in French", () => {
    expect(monthTitle("2026-10")).toBe("Octobre 2026");
    expect(monthTitle("2027-02")).toBe("Février 2027");
    expect(formatDayLong("2026-10-10")).toBe("samedi 10 octobre 2026");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2027-01", -1)).toBe("2026-12");
  });

  it("disables the days before today at the parking", () => {
    expect(isDisabled("2026-10-01", MIN)).toBe(true);
    expect(isDisabled(MIN, MIN)).toBe(false);
  });
});

describe("range selection", () => {
  it("first click sets the drop-off, second the return", () => {
    const a = pickDay(empty, "2026-10-10", MIN);
    expect(a).toEqual({ start: "2026-10-10", end: null, picking: "end" });
    const b = pickDay(a, "2026-10-14", MIN);
    expect(b).toEqual({ start: "2026-10-10", end: "2026-10-14", picking: "start" });
  });

  it("ignores disabled days", () => {
    expect(pickDay(empty, "2026-10-01", MIN)).toBe(empty);
  });

  it("a return before the drop-off becomes the new drop-off", () => {
    expect(pickDay({ start: "2026-10-10", end: null, picking: "end" }, "2026-10-05", MIN)).toEqual({ start: "2026-10-05", end: null, picking: "end" });
  });

  it("changing the drop-off keeps a return that still comes after it, drops one that does not", () => {
    const range = { start: "2026-10-10", end: "2026-10-14", picking: "start" as const };
    expect(pickDay(range, "2026-10-12", MIN)).toEqual({ start: "2026-10-12", end: "2026-10-14", picking: "end" });
    expect(pickDay(range, "2026-10-20", MIN)).toEqual({ start: "2026-10-20", end: null, picking: "end" });
  });

  it("allows a same-day stay", () => {
    const d = pickDay(pickDay(empty, "2026-10-10", MIN), "2026-10-10", MIN);
    expect(d).toMatchObject({ start: "2026-10-10", end: "2026-10-10" });
    expect(dayState("2026-10-10", d)).toBe("single");
    expect(rangeDays(d.start, d.end)).toBe(1);
  });

  it("marks the ends and the days between", () => {
    const r = { start: "2026-10-10", end: "2026-10-14" };
    expect(dayState("2026-10-10", r)).toBe("start");
    expect(dayState("2026-10-12", r)).toBe("between");
    expect(dayState("2026-10-14", r)).toBe("end");
    expect(dayState("2026-10-15", r)).toBeNull();
  });

  it("counts billable days like the API (every day touched) and sums them up", () => {
    expect(rangeDays("2026-10-10", "2026-10-14")).toBe(5);
    expect(rangeDays("2026-10-10", null)).toBeNull();
    expect(rangeSummary("2026-10-10", "2026-10-14")).toEqual({ dates: "sam. 10 oct. → mer. 14 oct.", days: "5 jours" });
    expect(rangeSummary("2026-10-10", null).dates).toBe("sam. 10 oct. → choisissez le retour");
    expect(rangeSummary(null, null).dates).toBe("Choisissez la date de dépôt");
  });
});

describe("keyboard navigation", () => {
  it("moves by day, week, week edges and month", () => {
    expect(moveFocus("2026-10-10", "ArrowRight", MIN)).toBe("2026-10-11");
    expect(moveFocus("2026-10-10", "ArrowLeft", MIN)).toBe("2026-10-09");
    expect(moveFocus("2026-10-10", "ArrowDown", MIN)).toBe("2026-10-17");
    expect(moveFocus("2026-10-10", "ArrowUp", MIN)).toBe("2026-10-03");
    expect(moveFocus("2026-10-10", "Home", MIN)).toBe("2026-10-05");
    expect(moveFocus("2026-10-10", "End", MIN)).toBe("2026-10-11");
    expect(moveFocus("2026-10-31", "PageDown", MIN)).toBe("2026-11-30");
    expect(moveFocus("2026-10-31", "ArrowRight", MIN)).toBe("2026-11-01");
    expect(moveFocus("2026-10-10", "Tab", MIN)).toBeNull();
  });

  it("never goes before today", () => {
    expect(moveFocus("2026-10-05", "ArrowUp", MIN)).toBe(MIN);
    expect(moveFocus("2026-10-10", "PageUp", MIN)).toBe(MIN);
  });

  it("shifts the months shown to keep the focused day visible", () => {
    expect(viewFor("2026-10", "2026-11-03", 2)).toBe("2026-10");
    expect(viewFor("2026-10", "2026-12-01", 2)).toBe("2026-11");
    expect(viewFor("2026-10", "2026-11-03", 1)).toBe("2026-11");
    expect(viewFor("2026-11", "2026-10-30", 2)).toBe("2026-10");
  });
});

describe("time slots", () => {
  it("offers every half hour from 05:00 to 23:30", () => {
    expect(TIME_SLOTS[0]).toBe("05:00");
    expect(TIME_SLOTS.at(-1)).toBe("23:30");
    expect(TIME_SLOTS).toHaveLength(38);
  });

  it("keeps a time off the grid (from a shared link) in order", () => {
    const options = timeOptions("15:05");
    expect(options).toHaveLength(39);
    expect(options.slice(options.indexOf("15:00"), options.indexOf("15:00") + 3)).toEqual(["15:00", "15:05", "15:30"]);
    expect(timeOptions("08:00")).toBe(TIME_SLOTS);
  });
});
