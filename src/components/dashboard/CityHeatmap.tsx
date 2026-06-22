import { useMemo } from "react";
import { DIMS, type Row } from "@/lib/dashboard-data";
import { fmtINR, fmtPct } from "@/lib/format";

type Metric = "sales" | "osa" | "discount" | "sov";

export function CityHeatmap({ rows }: { rows: Row[] }) {
  const grid = useMemo(() => {
    const cats = Array.from(new Set(rows.map((r) => r.Category))).sort();
    const cities = DIMS.cities;
    const map = new Map<string, { sales: number; osa: number; osaN: number; disc: number; discN: number; sov: number; sovN: number }>();
    rows.forEach((r) => {
      const key = `${r.Category}__${r.City}`;
      const e =
        map.get(key) ?? { sales: 0, osa: 0, osaN: 0, disc: 0, discN: 0, sov: 0, sovN: 0 };
      e.sales += r["Sales (MRP)"];
      if (r["Avg. OSA %"] > 0) { e.osa += r["Avg. OSA %"]; e.osaN += 1; }
      if (r.MRP > 0) { e.disc += r["Discount %"]; e.discN += 1; }
      if (r["Overall SOV"] > 0) { e.sov += r["Overall SOV"]; e.sovN += 1; }
      map.set(key, e);
    });
    return { cats, cities, map };
  }, [rows]);

  const get = (cat: string, city: string, m: Metric) => {
    const e = grid.map.get(`${cat}__${city}`);
    if (!e) return 0;
    if (m === "sales") return e.sales;
    if (m === "osa") return e.osaN ? e.osa / e.osaN : 0;
    if (m === "discount") return e.discN ? e.disc / e.discN : 0;
    return e.sovN ? e.sov / e.sovN : 0;
  };

  const renderTable = (m: Metric, title: string, color: string, fmt: (n: number) => string) => {
    const max = Math.max(
      ...grid.cats.flatMap((c) => grid.cities.map((ci) => get(c, ci, m))),
      0.0001,
    );
    return (
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold tracking-tight mb-3">{title}</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th className="text-left text-muted-foreground font-medium px-2 py-1">Category</th>
                {grid.cities.map((ci) => (
                  <th key={ci} className="text-center text-muted-foreground font-medium px-1.5 py-1">
                    {ci}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.cats.map((cat) => (
                <tr key={cat}>
                  <td className="font-medium px-2 py-1 whitespace-nowrap">{cat}</td>
                  {grid.cities.map((ci) => {
                    const v = get(cat, ci, m);
                    const intensity = max ? v / max : 0;
                    return (
                      <td
                        key={ci}
                        className="text-center px-2 py-2 rounded-md font-medium tabular-nums"
                        style={{
                          backgroundColor: `color-mix(in oklch, ${color} ${Math.round(intensity * 70)}%, oklch(0.24 0.025 250))`,
                          color: intensity > 0.5 ? "oklch(0.15 0.03 250)" : "oklch(0.92 0.01 250)",
                        }}
                      >
                        {v > 0 ? fmt(v) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (grid.cats.length === 0) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {renderTable("sales", "Sales Heatmap — Category × City", "var(--color-chart-1)", fmtINR)}
      {renderTable("osa", "OSA % Heatmap — Category × City", "var(--color-chart-4)", (n) => fmtPct(n))}
      {renderTable("discount", "Discount % — Category × City", "var(--color-chart-5)", (n) => fmtPct(n))}
      {renderTable("sov", "Overall SOV — Category × City", "var(--color-accent)", (n) => fmtPct(n, 2))}
    </div>
  );
}
