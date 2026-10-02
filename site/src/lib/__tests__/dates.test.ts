import { describe, expect, it } from "vitest";
import {
  cancellableUntil,
  defaultStay,
  formatDateTime,
  formatDateTimeAt,
  formatDay,
  formatStayDates,
  fromInstant,
  isValidDate,
  joinLocal,
  parseLocal,
  stayDays,
  stayFromParams,
  stayQuery,
  toInstant,
  todayLocal,
  validateStay,
} from "../dates";

const NOW = new Date("2026-10-01T10:00:00Z"); // Thursday 1 Oct 2026, 12:00 in Paris

describe("parsing", () => {
  it("accepts real local datetimes only", () => {
    expect(parseLocal("2026-10-04T06:30")).toEqual({ date: "2026-10-04", time: "06:30" });
    expect(parseLocal("2026-02-30T06:30")).toBeNull();
    expect(parseLocal("2026-10-04T24:00")).toBeNull();
    expect(parseLocal("2026-10-04 06:30")).toBeNull();
    expect(parseLocal("2026-10-04T06:30Z")).toBeNull();
    expect(parseLocal(undefined)).toBeNull();
    expect(isValidDate("2028-02-29")).toBe(true);
    expect(isValidDate("2027-02-29")).toBe(false);
  });

  it("joins the separate date and time fields", () => {
    expect(joinLocal("2026-10-04", "06:30")).toBe("2026-10-04T06:30");
    expect(joinLocal("2026-10-04", "")).toBeNull();
    expect(joinLocal("04/10/2026", "06:30")).toBeNull();
    expect(joinLocal(null, "06:30")).toBeNull();
  });

  it("converts Paris wall-clock times to instants and back, across DST", () => {
    expect(toInstant("2026-10-04T06:30")?.toISOString()).toBe("2026-10-04T04:30:00.000Z"); // summer, UTC+2
    expect(toInstant("2026-11-04T06:30")?.toISOString()).toBe("2026-11-04T05:30:00.000Z"); // winter, UTC+1
    expect(fromInstant(new Date("2026-10-25T00:30:00Z"))).toBe("2026-10-25T02:30");
    expect(fromInstant(new Date("2026-10-25T01:30:00Z"))).toBe("2026-10-25T02:30"); // clocks went back
    expect(toInstant("nonsense")).toBeNull();
  });
});

describe("defaults", () => {
  it("uses the parking's day, not the server's", () => {
    expect(todayLocal(NOW)).toBe("2026-10-01");
    expect(todayLocal(new Date("2026-10-01T22:30:00Z"))).toBe("2026-10-02"); // 00:30 in Paris
  });

  it("suggests tomorrow 08:00 to a week later 18:00", () => {
    expect(defaultStay(NOW)).toEqual({ arrivee: "2026-10-02T08:00", retour: "2026-10-09T18:00" });
  });
});

describe("French formatting", () => {
  it("formats days and times like the mockups", () => {
    expect(formatDay("2026-10-04")).toBe("dim. 4 oct.");
    expect(formatDay("2026-05-01")).toBe("ven. 1 mai");
    expect(formatDateTime("2026-10-04T06:30")).toBe("dim. 4 oct. · 06:30");
    expect(formatDateTimeAt("2026-10-03T06:30")).toBe("sam. 3 oct. à 06:30");
    expect(formatDateTime("bad")).toBe("bad");
  });
});

describe("stay rules", () => {
  it("counts every calendar day touched, like the API", () => {
    expect(stayDays("2026-10-04T06:30", "2026-10-11T15:05")).toBe(8);
    expect(stayDays("2026-10-01T08:30", "2026-10-03T17:00")).toBe(3);
    expect(stayDays("2026-10-04T06:30", "2026-10-04T20:00")).toBe(1);
  });

  it("computes the free cancellation deadline from the policy", () => {
    expect(cancellableUntil("free_24h", "2026-10-04T06:30")).toBe("2026-10-03T06:30");
    expect(cancellableUntil("free_48h", "2026-10-04T06:30")).toBe("2026-10-02T06:30");
    expect(cancellableUntil("free_until_arrival", "2026-10-04T06:30")).toBe("2026-10-04T06:30");
    expect(cancellableUntil("non_refundable", "2026-10-04T06:30")).toBeNull();
    // Clocks go back on 25 Oct 2026: 24 hours before 25 Oct 06:30 is 24 Oct 07:30 on the clock.
    expect(cancellableUntil("free_24h", "2026-10-25T06:30")).toBe("2026-10-24T07:30");
  });

  it("validates a stay with the API's codes", () => {
    expect(validateStay("2026-10-04T06:30", "2026-10-11T15:05", NOW)).toEqual({});
    expect(validateStay(null, "", NOW)).toEqual({ arrivalAt: "required", returnAt: "required" });
    expect(validateStay("2026-10-04T6:30", "2026-10-11T15:05", NOW)).toEqual({ arrivalAt: "invalid_datetime" });
    expect(validateStay("2026-10-04T06:30", "2026-10-04T06:30", NOW)).toEqual({ returnAt: "return_before_arrival" });
    expect(validateStay("2026-09-30T06:30", "2026-10-04T06:30", NOW)).toEqual({ arrivalAt: "arrival_in_past" });
    expect(validateStay("2026-10-04T06:30", "2027-01-04T06:30", NOW)).toEqual({ returnAt: "stay_too_long" });
    // 90 calendar days across the October clock change (90 days and 1 hour of elapsed time): allowed.
    expect(validateStay("2026-10-02T08:00", "2026-12-31T08:00", NOW)).toEqual({});
    expect(validateStay("2026-10-02T08:00", "2026-12-31T08:01", NOW)).toEqual({ returnAt: "stay_too_long" });
  });

  it("reads and writes the stay in the URL", () => {
    expect(stayFromParams({ arrivee: "2026-10-04T06:30", retour: ["2026-10-11T15:05", "x"] })).toEqual({
      arrivee: "2026-10-04T06:30",
      retour: "2026-10-11T15:05",
    });
    expect(stayFromParams({})).toEqual({ arrivee: null, retour: null });
    expect(stayQuery({ arrivee: "2026-10-04T06:30", retour: "2026-10-11T15:05" })).toBe("?arrivee=2026-10-04T06:30&retour=2026-10-11T15:05");
    expect(stayQuery({ arrivee: null, retour: "2026-10-11T15:05" })).toBe("");
  });
});

describe("formatStayDates (the phone's single dates pill)", () => {
  it("drops the month on the return when it is the drop-off's", () => {
    expect(formatStayDates("2026-10-03", "2026-10-10")).toEqual({ start: "sam. 3 oct.", end: "sam. 10" });
    expect(formatStayDates("2026-10-03", "2026-10-03")).toEqual({ start: "sam. 3 oct.", end: "sam. 3" });
  });

  it("keeps the month on the return when it differs", () => {
    expect(formatStayDates("2026-10-28", "2026-11-04")).toEqual({ start: "mer. 28 oct.", end: "mer. 4 nov." });
  });

  it("adds the year on the return when it differs (same month number too)", () => {
    expect(formatStayDates("2026-12-28", "2027-01-04")).toEqual({ start: "lun. 28 déc.", end: "lun. 4 janv. 2027" });
    expect(formatStayDates("2026-10-03", "2027-10-05")).toEqual({ start: "sam. 3 oct.", end: "mar. 5 oct. 2027" });
  });
});
