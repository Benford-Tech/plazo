/**
 * A small reader of Excel workbooks (.xlsx) for the import of old bookings (28/10/2026): a workbook is a zip of XML
 * files; its entries are inflated by the browser itself (DecompressionStream) and read with DOMParser, so no library
 * is loaded. Every cell comes back as text: numbers as Excel stores them (a date is its serial, « 45903.3125 »), which
 * the server reads.
 */

export interface Sheet {
  name: string;
  rows: string[][];
}

interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  offset: number;
}

function entries(view: DataView): ZipEntry[] {
  // The end of central directory record sits in the last 64 KB (after an optional comment).
  let end = -1;
  for (let i = view.byteLength - 22; i >= Math.max(0, view.byteLength - 65557); i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error("not_a_workbook");
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const list: ZipEntry[] = [];
  const decoder = new TextDecoder();
  for (let i = 0; i < count; i += 1) {
    if (view.getUint32(at, true) !== 0x02014b50) throw new Error("not_a_workbook");
    const method = view.getUint16(at + 10, true);
    const compressedSize = view.getUint32(at + 20, true);
    const nameLength = view.getUint16(at + 28, true);
    const extraLength = view.getUint16(at + 30, true);
    const commentLength = view.getUint16(at + 32, true);
    const offset = view.getUint32(at + 42, true);
    const name = decoder.decode(new Uint8Array(view.buffer, view.byteOffset + at + 46, nameLength));
    list.push({ name, method, compressedSize, offset });
    at += 46 + nameLength + extraLength + commentLength;
  }
  return list;
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Response(data as Uint8Array<ArrayBuffer>).body!.pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readEntry(view: DataView, entry: ZipEntry): Promise<string> {
  const local = entry.offset;
  if (view.getUint32(local, true) !== 0x04034b50) throw new Error("not_a_workbook");
  const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
  const raw = new Uint8Array(view.buffer, view.byteOffset + start, entry.compressedSize);
  const bytes = entry.method === 0 ? raw : entry.method === 8 ? await inflate(raw) : null;
  if (!bytes) throw new Error("not_a_workbook");
  return new TextDecoder().decode(bytes);
}

const xml = (text: string) => new DOMParser().parseFromString(text, "application/xml");
/** Elements by local name, whatever their namespace prefix. */
const all = (node: Document | Element, name: string) => Array.from(node.getElementsByTagNameNS("*", name));

/** "B12" → 1 (the column's index from 0). */
function columnIndex(ref: string): number {
  const letters = /^[A-Z]+/.exec(ref)?.[0] ?? "A";
  return [...letters].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
}

/** The sheets of a workbook, in its order, each as rows of texts (empty rows left out). */
export async function readWorkbook(buffer: ArrayBuffer): Promise<Sheet[]> {
  const view = new DataView(buffer);
  const list = entries(view);
  const byName = new Map(list.map(e => [e.name.replace(/^\//, ""), e]));
  const file = async (name: string) => {
    const entry = byName.get(name);
    return entry ? readEntry(view, entry) : null;
  };

  const workbook = await file("xl/workbook.xml");
  if (!workbook) throw new Error("not_a_workbook");
  const rels = xml((await file("xl/_rels/workbook.xml.rels")) ?? "<Relationships/>");
  const targets = new Map(all(rels, "Relationship").map(r => [r.getAttribute("Id"), r.getAttribute("Target") ?? ""]));
  const sharedText = await file("xl/sharedStrings.xml");
  const shared = sharedText ? all(xml(sharedText), "si").map(si => all(si, "t").map(t => t.textContent ?? "").join("")) : [];

  const sheets: Sheet[] = [];
  for (const sheet of all(xml(workbook), "sheet")) {
    const id = sheet.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") ?? sheet.getAttribute("r:id");
    const target = targets.get(id) ?? "";
    const path = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`;
    const text = await file(path);
    if (!text) continue;
    const rows: string[][] = [];
    for (const row of all(xml(text), "row")) {
      const cells: string[] = [];
      all(row, "c").forEach((c, i) => {
        const ref = c.getAttribute("r");
        const index = ref ? columnIndex(ref) : i;
        const type = c.getAttribute("t");
        const value = all(c, "v")[0]?.textContent ?? "";
        let cell = value;
        if (type === "s") cell = shared[Number(value)] ?? "";
        else if (type === "inlineStr") cell = all(c, "t").map(t => t.textContent ?? "").join("");
        else if (type === "b") cell = value === "1" ? "VRAI" : "FAUX";
        while (cells.length < index) cells.push("");
        cells[index] = cell;
      });
      if (cells.some(c => c.trim() !== "")) rows.push(cells);
    }
    sheets.push({ name: sheet.getAttribute("name") ?? `Feuille ${sheets.length + 1}`, rows });
  }
  return sheets;
}
