import { bannerText, eventKey, liveFirst, miniMapPoints, positionAge, shortName, withLiveSignals } from "./arrivals";
import { signal } from "@/test/arrival-fixtures";
import type { ArrivalSignal, PlanningRow } from "./types";

const row = (id: string, s: ArrivalSignal | null = null) => ({ id, arrivalSignal: s }) as unknown as PlanningRow;

describe("arrivées en direct", () => {
  it("abrège le nom", () => {
    expect(shortName("Camille Martin")).toBe("C. Martin");
    expect(shortName("Madonna")).toBe("Madonna");
  });

  it("abrège avec le prénom et le nom à part quand le serveur les donne", () => {
    expect(shortName("Marie Claire Dupont", { firstName: "Marie Claire", lastName: "Dupont" })).toBe("M. Dupont");
    expect(shortName("Marie Claire Dupont", { firstName: "Marie Claire", lastName: "" })).toBe("M. Claire Dupont");
    expect(shortName("Camille Martin", { firstName: null, lastName: null })).toBe("C. Martin");
    expect(bannerText(signal({ customerName: "Marie Claire Dupont", customerFirstName: "Marie Claire", customerLastName: "Dupont" }))).toBe(
      "M. Dupont arrive dans 12 min — AB-123-CD",
    );
  });

  it("écrit le bandeau selon le signal", () => {
    expect(bannerText(signal())).toBe("C. Martin arrive dans 12 min — AB-123-CD");
    expect(bannerText(signal({ state: "announced", announcedMinutes: 20 }))).toBe("C. Martin : « J'arrive dans 20 min » — AB-123-CD");
    expect(bannerText(signal({ kind: "return", state: "at_meeting_point" }))).toBe("Retour : C. Martin est au point de rendez-vous — AB-123-CD");
    expect(bannerText(signal({ state: "announced", announcedMinutes: 10, note: "2 enfants, poussette" }))).toBe("C. Martin : « J'arrive dans 10 min » — AB-123-CD · « 2 enfants, poussette »");
  });

  it("met en tête les voyageurs en approche, triés par ETA", () => {
    const rows = [row("a"), row("b", signal({ id: "sb", reservationId: "b", etaMinutes: 20 })), row("c", signal({ id: "sc", reservationId: "c", etaMinutes: 5 }))];
    expect(liveFirst(rows).map(r => r.id)).toEqual(["c", "b", "a"]);
    const announced = [row("a"), row("b", signal({ reservationId: "b", state: "announced" }))];
    expect(liveFirst(announced).map(r => r.id)).toEqual(["a", "b"]);
  });

  it("préfère la liste interrogée en direct au planning", () => {
    const rows = [row("r1", signal({ etaMinutes: 30 }))];
    expect(withLiveSignals(rows, "outbound", [signal({ etaMinutes: 9 })])[0].arrivalSignal?.etaMinutes).toBe(9);
    expect(withLiveSignals(rows, "return", [signal()])[0].arrivalSignal).toBeNull();
    expect(withLiveSignals(rows, "outbound", undefined)).toBe(rows);
  });

  it("change de clé à chaque nouvel événement", () => {
    expect(eventKey(signal())).not.toBe(eventKey(signal({ state: "at_meeting_point" })));
    expect(eventKey(signal({ state: "announced", announcedMinutes: 10 }))).not.toBe(eventKey(signal({ state: "announced", announcedMinutes: 20 })));
  });

  it("vieillit la position entre deux interrogations", () => {
    expect(positionAge(signal(), 1000, 6000)).toBe(25);
    expect(positionAge(signal({ positionAgeSeconds: null }), 0, 0)).toBeNull();
  });

  it("place le voyageur au nord du point de rendez-vous, dans le cadre", () => {
    const { me, meeting } = miniMapPoints({ lat: 45.8, lng: 5.05 }, { lat: 45.73, lng: 5.05 }, { width: 320, height: 110, padding: 20 });
    expect(me.y).toBeLessThan(meeting.y);
    expect(me.x).toBeCloseTo(meeting.x);
    for (const p of [me, meeting]) expect(p.y).toBeGreaterThanOrEqual(20);
  });
});
