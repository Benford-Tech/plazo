import { deflateRawSync } from "node:zlib";
import { guessMapping, missingFields, readImportFile, rowsFor } from "./booking-import";

/** A minimal zip (stored or deflated entries), enough for the workbook reader. */
function zip(files: Record<string, string>, deflate = false): Uint8Array<ArrayBuffer> {
  const enc = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const nameBytes = enc.encode(name);
    const raw = enc.encode(content);
    const data = deflate ? new Uint8Array(deflateRawSync(raw)) : raw;
    const local = new Uint8Array(30 + nameBytes.length + data.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(8, deflate ? 8 : 0, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, raw.length, true);
    lv.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(10, deflate ? 8 : 0, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, raw.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralSize = centrals.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, centrals.length, true);
  ev.setUint16(10, centrals.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  const out = new Uint8Array(offset + centralSize + 22);
  let at = 0;
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

const WORKBOOK = {
  "xl/workbook.xml":
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Réservations" sheetId="1" r:id="rId1"/></sheets></workbook>',
  "xl/_rels/workbook.xml.rels":
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
  "xl/sharedStrings.xml":
    '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>Nom client</t></si><si><t>Date dépôt</t></si><si><t>Date retour</t></si><si><t>Claire Martin</t></si></sst>',
  "xl/worksheets/sheet1.xml":
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="D1" t="s"><v>2</v></c></row><row r="2"><c r="A2" t="s"><v>3</v></c><c r="B2"><v>45903.3125</v></c><c r="D2"><v>45910</v></c></row></sheetData></worksheet>',
};

describe("import of old bookings: the file", () => {
  it("recognises the usual column titles", () => {
    const mapping = guessMapping(["Nom client", "Tél", "Immat", "Date dépôt", "Heure retour", "Date retour", "Vol retour", "Prix TTC", "Source", "N° résa", "Divers"]);
    expect(mapping).toEqual(["name", "phone", "plate", "arrivalDate", "returnTime", "returnDate", "returnFlight", "price", "channel", "reference", null]);
    expect(missingFields(mapping)).toEqual([]);
    expect(guessMapping(["Prénom", "Nom", "Arrivée", "Départ"])).toEqual(["firstName", "lastName", "arrivalDate", "returnDate"]);
    expect(guessMapping(["Nom", "Du", "Au"])).toEqual(["name", "arrivalDate", "returnDate"]);
    expect(missingFields(["name", null])).toEqual(["arrivalDate", "returnDate"]);
  });

  it("keeps the mapped cells of each line", () => {
    const rows = rowsFor(
      [
        ["Nom", "Divers", "Du"],
        ["Claire Martin", "x", "03/09/2025"],
      ],
      ["name", null, "arrivalDate"],
    );
    expect(rows).toEqual([{ line: 2, name: "Claire Martin", arrivalDate: "03/09/2025" }]);
  });

  it.each([false, true])("reads an Excel workbook (deflated: %s)", async deflate => {
    const file = new File([zip(WORKBOOK, deflate)], "planning.xlsx");
    const read = await readImportFile(file);
    expect(read.sheets).toEqual([
      {
        name: "Réservations",
        rows: [
          ["Nom client", "Date dépôt", "", "Date retour"],
          ["Claire Martin", "45903.3125", "", "45910"],
        ],
      },
    ]);
  });

  it("reads a CSV file and refuses the old .xls", async () => {
    const csv = await readImportFile(new File(["Nom;Du;Au\nClaire Martin;03/09/2025;10/09/2025\n"], "planning.csv"));
    expect(csv.sheets[0].rows[1]).toEqual(["Claire Martin", "03/09/2025", "10/09/2025"]);
    await expect(readImportFile(new File(["ÐÏ"], "vieux.xls"))).rejects.toThrow("old_excel");
  });

  it("takes « Canal » over « Source » for the channel, and « Source » when it is the only one", () => {
    expect(guessMapping(["Référence", "Source", "Canal", "Prix (€)"])).toEqual(["reference", null, "channel", "price"]);
    expect(guessMapping(["Source", "Client"])).toEqual(["channel", "name"]);
  });
});

describe("service and commission columns", () => {
  it("maps the Service and Commission headers", () => {
    const mapping = guessMapping(["Nom", "Arrivée", "Départ", "Service", "Commission (€)", "Canal", "Paiement"]);
    expect(mapping[3]).toBe("handover");
    expect(mapping[4]).toBe("commission");
    expect(mapping[5]).toBe("channel");
    expect(mapping[6]).toBe("payment");
  });
});
