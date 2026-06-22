import { useMemo, useState } from "react";
import { ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
import type { Row } from "@/lib/dashboard-data";
import { fmtINR, fmtNum, fmtPct } from "@/lib/format";

type Agg = {
  sku: string;
  brand: string;
  category: string;
  grammage: string;
  cities: number;
  sales: number;
  qty: number;
  osa: number;
  disc: number;
  sov: number;
};

type Key = keyof Agg;

export function SkuTable({ rows }: { rows: Row[] }) {
  const [sort, setSort] = useState<{ k: Key; dir: "asc" | "desc" }>({
    k: "sales",
    dir: "desc",
  });
  const [limit, setLimit] = useState(25);

  const data: Agg[] = useMemo(() => {
    const m = new Map<string, Agg & { osaN: number; discN: number; sovN: number; citySet: Set<string> }>();
    rows.forEach((r) => {
      const key = r["SKU Name"] + "||" + r.Brand;
      const e =
        m.get(key) ??
        {
          sku: r["SKU Name"],
          brand: r.Brand,
          category: r.Category,
          grammage: r.Grammage,
          cities: 0,
          sales: 0,
          qty: 0,
          osa: 0,
          disc: 0,
          sov: 0,
          osaN: 0,
          discN: 0,
          sovN: 0,
          citySet: new Set<string>(),
        };
      e.sales += r["Sales (MRP)"];
      e.qty += r["Qty Sold"];
      e.citySet.add(r.City);
      if (r["Avg. OSA %"] > 0) { e.osa += r["Avg. OSA %"]; e.osaN += 1; }
      if (r.MRP > 0) { e.disc += r["Discount %"]; e.discN += 1; }
      if (r["Overall SOV"] > 0) { e.sov += r["Overall SOV"]; e.sovN += 1; }
      m.set(key, e);
    });
    return [...m.values()].map((e) => ({
      sku: e.sku,
      brand: e.brand,
      category: e.category,
      grammage: e.grammage,
      cities: e.citySet.size,
      sales: e.sales,
      qty: e.qty,
      osa: e.osaN ? e.osa / e.osaN : 0,
      disc: e.discN ? e.disc / e.discN : 0,
      sov: e.sovN ? e.sov / e.sovN : 0,
    }));
  }, [rows]);

  const sorted = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = a[sort.k];
      const bv = b[sort.k];
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
  }, [data, sort]);

  const toggle = (k: Key) =>
    setSort((s) => (s.k === k ? { k, dir: s.dir === "asc" ? "desc" : "asc" } : { k, dir: "desc" }));

  const Hdr = ({ k, children, align = "left" }: { k: Key; children: React.ReactNode; align?: "left" | "right" }) => (
    <th
      onClick={() => toggle(k)}
      className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground select-none ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <span className={`inline-flex items-center gap-1 ${align === "right" ? "flex-row-reverse" : ""}`}>
        {children}
        {sort.k === k ? (
          sort.dir === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-40" />
        )}
      </span>
    </th>
  );

  const visible = sorted.slice(0, limit);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-baseline justify-between p-5 pb-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">SKU Performance</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fmtNum(sorted.length)} SKUs · showing top {Math.min(limit, sorted.length)}
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-y border-border/60 bg-secondary/30">
            <tr>
              <Hdr k="sku">SKU</Hdr>
              <Hdr k="brand">Brand</Hdr>
              <Hdr k="category">Category</Hdr>
              <Hdr k="cities" align="right">Cities</Hdr>
              <Hdr k="sales" align="right">Sales (MRP)</Hdr>
              <Hdr k="qty" align="right">Qty</Hdr>
              <Hdr k="osa" align="right">OSA %</Hdr>
              <Hdr k="disc" align="right">Disc %</Hdr>
              <Hdr k="sov" align="right">SOV %</Hdr>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr
                key={r.sku + i}
                className="border-b border-border/40 hover:bg-secondary/30 transition"
              >
                <td className="px-3 py-2.5 text-sm max-w-[320px] truncate font-medium" title={r.sku}>
                  {r.sku}
                </td>
                <td className="px-3 py-2.5 text-sm text-muted-foreground">{r.brand}</td>
                <td className="px-3 py-2.5 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-secondary border border-border/60">
                    {r.category}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-sm text-right tabular-nums">{r.cities}</td>
                <td className="px-3 py-2.5 text-sm text-right tabular-nums font-medium">{fmtINR(r.sales)}</td>
                <td className="px-3 py-2.5 text-sm text-right tabular-nums">{fmtNum(r.qty)}</td>
                <td className="px-3 py-2.5 text-sm text-right tabular-nums">{r.osa ? fmtPct(r.osa) : "—"}</td>
                <td className="px-3 py-2.5 text-sm text-right tabular-nums">{r.disc ? fmtPct(r.disc) : "—"}</td>
                <td className="px-3 py-2.5 text-sm text-right tabular-nums">{r.sov ? fmtPct(r.sov, 2) : "—"}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center text-muted-foreground text-sm">
                  No SKUs match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {limit < sorted.length && (
        <div className="p-4 text-center border-t border-border/40">
          <button
            onClick={() => setLimit((l) => l + 50)}
            className="text-sm font-medium text-primary hover:text-primary/80 transition"
          >
            Show 50 more →
          </button>
        </div>
      )}
    </div>
  );
}
