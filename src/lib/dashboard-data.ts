import rawData from "@/data/zepto.json";

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

export const DATA: Row[] = (rawData as Row[]).map((r) => ({
  ...r,
  City: r.City || "Unknown",
}));

export const DIMS = {
  dates: Array.from(new Set(DATA.map((r) => r.Date))).sort(),
  brands: Array.from(new Set(DATA.map((r) => r.Brand))).sort(),
  cities: Array.from(new Set(DATA.map((r) => r.City))).sort(),
  categories: Array.from(new Set(DATA.map((r) => r.Category))).sort(),
};

export const RIO_BRAND = "Enjoyrio";
