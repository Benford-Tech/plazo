// Shifts the API's clock for the store screenshots (node -r ./fake-clock.cjs lib/server.js).
// The scenario needs daytime at the parking whatever the hour of the run: PLAZO_CLOCK_OFFSET_MS moves
// Date.now() and `new Date()` forward or back; dates built from explicit values are untouched. Never
// used outside this tool.
const offset = Number(process.env.PLAZO_CLOCK_OFFSET_MS || 0);
if (offset) {
  const RealDate = Date;
  class ShiftedDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(RealDate.now() + offset);
      else super(...args);
    }
    static now() {
      return RealDate.now() + offset;
    }
  }
  globalThis.Date = ShiftedDate;
}
