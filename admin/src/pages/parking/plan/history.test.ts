import {
  BURST_MS,
  MAX_STEPS,
  PlanHistory,
  planFields,
  touchesPlan,
  type Step,
} from "./history";

const plan = (n: number) =>
  planFields({
    outline: null,
    parcels: [],
    scaleFactor: n,
    zones: [],
    exclusions: [],
    settings: {},
    landmarks: [],
  });
// What is there now, for the steps that need it.
let now: Step = { plan: plan(0) };
const current = (step: Step): Step => ({
  ...(step.plan ? { plan: now.plan } : {}),
  ...(step.files ? { files: now.files } : {}),
});

describe("historique du plan (Ctrl+Z, 09/10/2026)", () => {
  it("annule puis rétablit, dans l'ordre", () => {
    const h = new PlanHistory();
    h.record({ plan: plan(1) }, 0);
    h.record({ plan: plan(2) }, 10_000);
    now = { plan: plan(3) };
    expect(h.undo(current)).toEqual({ plan: plan(2) });
    now = { plan: plan(2) };
    expect(h.undo(current)).toEqual({ plan: plan(1) });
    now = { plan: plan(1) };
    expect(h.undo(current)).toBeNull();
    expect(h.redo(current)).toEqual({ plan: plan(2) });
    now = { plan: plan(2) };
    expect(h.redo(current)).toEqual({ plan: plan(3) });
    expect(h.redo(current)).toBeNull();
  });

  it("des gestes du même genre très rapprochés font une seule étape, un nouveau geste oublie ce qui était annulé", () => {
    const h = new PlanHistory();
    h.record({ plan: plan(1) }, 0);
    h.record({ plan: plan(2) }, BURST_MS - 1);
    // A file right after is another step.
    h.record({ files: [] }, BURST_MS);
    now = { plan: plan(9), files: [{ code: "F01", capacity: 3 }] };
    expect(h.undo(current)).toEqual({ files: [] });
    expect(h.undo(current)).toEqual({ plan: plan(1) });
    expect(h.canRedo).toBe(true);
    h.record({ plan: plan(5) }, 50_000);
    expect(h.canRedo).toBe(false);
  });

  it("remet en place une étape qui n'a pas pu s'appliquer, et oublie tout après la passe automatique", () => {
    const h = new PlanHistory();
    h.record({ files: [] }, 0);
    now = { files: [{ code: "F01", capacity: 3 }] };
    const step = h.undo(current)!;
    h.revert("undo", step);
    expect(h.canUndo).toBe(true);
    expect(h.canRedo).toBe(false);
    h.clear();
    expect(h.canUndo).toBe(false);
  });

  it(`garde les ${MAX_STEPS} dernières étapes`, () => {
    const h = new PlanHistory();
    for (let i = 0; i < MAX_STEPS + 5; i++)
      h.record({ plan: plan(i) }, i * 10_000);
    let count = 0;
    while (h.undo(current)) count++;
    expect(count).toBe(MAX_STEPS);
  });

  it("ne compte que les changements du dessin", () => {
    expect(touchesPlan({ zones: [] })).toBe(true);
    expect(touchesPlan({ results: {} })).toBe(false);
  });
});
