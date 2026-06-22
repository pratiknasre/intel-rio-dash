import { createServerFn } from "@tanstack/react-start";

// ───────────────────────── Row shape ─────────────────────────
// Column names here must match the Google Sheet header row exactly.
export type Row = {
  Date: string;
  Brand: string;
  Product_ID: string;
  Item_ID: string;
  "SKU Name": string;
  Grammage: string;
  Category: string;
  City: string;
  "Sales (MRP)": number;
  "Sales (SP)": number;
  MRP: number;
  SP: number;
  "Qty Sold": number;
  "Avg. OSA %": number;
  "Discount %": number;
  PPU: number;
  "Category Share (MRP)": number;
  "Category Share (SP)": number;
  "Overall SOV": number;
  "Organic SOV": number;
  "Paid SOV": number;
};

// ───────────────────────── Source ─────────────────────────
// The sheet must be shared as "Anyone with the link can view".
// gviz CSV endpoint returns the tab as CSV without needing an API key.
const SHEET_ID = "1sRDI5KlSwaA9sSJnrFz-vZPiut6PjnA46f5X5YoiOoY";
const GID = "0";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

// Columns kept as raw strings; everything else is coerced to a number.
const STRING_COLS = new Set([
  "Date",
  "Brand",
  "Product_ID",
  "Item_ID",
  "SKU Name",
  "Grammage",
  "Category",
  "City",
]);

// ───────────────────────── CSV parsing ─────────────────────────
// Minimal RFC-4180 parser: handles quoted fields, embedded commas/newlines,
// and "" escaped quotes.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Normalize dates to ISO (YYYY-MM-DD) so string sorting stays chronological.
// Accepts both "2026-06-21" and "21/06/26" (DD/MM/YY).
function normalizeDate(s: string): string {
  const t = s.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const d = m[1].padStart(2, "0");
    const mo = m[2].padStart(2, "0");
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${mo}-${d}`;
  }
  return t;
}

export function parseRows(csv: string): Row[] {
  const table = parseCSV(csv);
  if (table.length < 2) return [];

  const header = table[0].map((h) => h.trim());
  const out: Row[] = [];

  for (let i = 1; i < table.length; i++) {
    const cells = table[i];
    if (cells.every((c) => c.trim() === "")) continue; // skip blank rows

    const obj: Record<string, string | number> = {};
    header.forEach((key, j) => {
      const raw = (cells[j] ?? "").trim();
      if (key === "Date") {
        obj[key] = normalizeDate(raw);
      } else if (STRING_COLS.has(key)) {
        obj[key] = raw;
      } else {
        const n = Number(raw);
        obj[key] = Number.isFinite(n) ? n : 0;
      }
    });
    obj.City = (obj.City as string) || "Unknown";
    out.push(obj as Row);
  }
  return out;
}

// ───────────────────────── Server function ─────────────────────────
// Runs on the server (during SSR and as an RPC on client refresh), so the
// browser never hits Google directly — no CORS headaches.
export const fetchSheetRows = createServerFn({ method: "GET" }).handler(
  async (): Promise<Row[]> => {
    const res = await fetch(CSV_URL, { headers: { "cache-control": "no-cache" } });
    if (!res.ok) {
      throw new Error(`Google Sheet fetch failed: ${res.status} ${res.statusText}`);
    }
    const csv = await res.text();
    return parseRows(csv);
  },
);
