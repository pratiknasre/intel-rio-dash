import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, Search, X, Sparkles, RefreshCw, Sun, Moon,
  Calendar, Building2, Layers, MapPin,
  TrendingUp, ShoppingCart, Package, Percent, Eye, Tags,
  Check, ChevronDown, ArrowUpDown, ArrowDown, ArrowUp,
  type LucideIcon,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import rawData from "@/data/zepto.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quick Comm Intel — RIO" },
      {
        name: "description",
        content:
          "RIO's Quick Commerce Intelligence dashboard — SKU x City performance across Zepto with filters for brand, category, city and date.",
      },
    ],
  }),
  component: Dashboard,
});

// ───────────────────────── Data layer ─────────────────────────
type Row = {
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

const DATA: Row[] = (rawData as Row[]).map((r) => ({ ...r, City: r.City || "Unknown" }));
const DIMS = {
  dates: Array.from(new Set(DATA.map((r) => r.Date))).sort(),
  brands: Array.from(new Set(DATA.map((r) => r.Brand))).sort(),
  cities: Array.from(new Set(DATA.map((r) => r.City))).sort(),
  categories: Array.from(new Set(DATA.map((r) => r.Category))).sort(),
};
const RIO_BRAND = "Enjoyrio";

// ───────────────────────── Formatting ─────────────────────────
const fmtNum = (n: number, digits = 0) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(n);
const fmtINR = (n: number) => {
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
};
const fmtPct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

// ───────────────────────── Theme ─────────────────────────
function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("rio-theme") as "light" | "dark" | null;
    const initial =
      stored ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
  }, []);
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    try { localStorage.setItem("rio-theme", theme); } catch {}
  }, [theme]);
  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}

// ───────────────────────── MultiSelect ─────────────────────────
function MultiSelect({
  label, icon: Icon, options, selected, onChange, searchable,
}: {
  label: string;
  icon: LucideIcon;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  searchable?: boolean;
}) {
  const [q, setQ] = useState("");
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase())) : options;
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  const summary =
    selected.length === 0 ? "All" : selected.length === 1 ? selected[0] : `${selected.length} selected`;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="group flex items-center gap-2.5 w-full rounded-xl border border-border/60 bg-secondary/40 hover:bg-secondary/70 transition px-3.5 py-2.5 text-left">
          <Icon className="size-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
            <div className="text-sm font-medium truncate">{summary}</div>
          </div>
          <ChevronDown className="size-4 text-muted-foreground group-hover:text-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0 bg-popover border-border">
        {searchable && (
          <div className="p-2 border-b border-border">
            <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-8 bg-secondary/50" />
          </div>
        )}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border text-xs">
          <span className="text-muted-foreground">{selected.length}/{options.length}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => onChange(options)}>All</Button>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => onChange([])}>Clear</Button>
          </div>
        </div>
        <div className="max-h-72 overflow-auto py-1">
          {filtered.map((o) => {
            const on = selected.includes(o);
            return (
              <button key={o} onClick={() => toggle(o)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-secondary/70 text-left">
                <span className={`size-4 rounded border grid place-items-center transition ${on ? "bg-primary border-primary text-primary-foreground" : "border-border bg-secondary"}`}>
                  {on && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span className="truncate">{o}</span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">No matches</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ───────────────────────── KPI ─────────────────────────
function Kpi({
  label, value, sub, icon: Icon, accent,
}: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
      <div
        className="absolute -top-10 -right-10 size-32 rounded-full opacity-20 blur-2xl transition group-hover:opacity-30"
        style={{ background: accent ?? "var(--color-primary)" }}
      />
      <div className="flex items-start justify-between relative">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">{label}</div>
          <div className="mt-2 text-2xl font-bold font-display tracking-tight">{value}</div>
          {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
        </div>
        <div
          className="size-9 rounded-lg grid place-items-center border border-border/60"
          style={{ background: `color-mix(in oklch, ${accent ?? "var(--color-primary)"} 18%, transparent)` }}
        >
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Charts ─────────────────────────
const CHART_COLORS = [
  "var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)",
  "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-accent)",
];
const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
};
const axisTick = { fill: "var(--muted-foreground)", fontSize: 11 };
const gridStroke = "var(--border)";

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="h-72">{children}</div>
    </div>
  );
}

function ChartsGrid({ rows }: { rows: Row[] }) {
  const byCity = useMemo(() => {
    const m = new Map<string, { city: string; sales: number; qty: number }>();
    rows.forEach((r) => {
      const e = m.get(r.City) ?? { city: r.City, sales: 0, qty: 0 };
      e.sales += r["Sales (MRP)"]; e.qty += r["Qty Sold"];
      m.set(r.City, e);
    });
    return [...m.values()].sort((a, b) => b.sales - a.sales);
  }, [rows]);

  const byBrand = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(r.Brand, (m.get(r.Brand) ?? 0) + r["Sales (MRP)"]));
    return [...m.entries()].map(([brand, sales]) => ({ brand, sales })).sort((a, b) => b.sales - a.sales).slice(0, 10);
  }, [rows]);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(r.Category, (m.get(r.Category) ?? 0) + r["Sales (MRP)"]));
    return [...m.entries()].map(([name, value]) => ({ name, value }));
  }, [rows]);

  const trend = useMemo(() => {
    const m = new Map<string, { date: string; sales: number; qty: number; sov: number; n: number }>();
    rows.forEach((r) => {
      const e = m.get(r.Date) ?? { date: r.Date, sales: 0, qty: 0, sov: 0, n: 0 };
      e.sales += r["Sales (MRP)"]; e.qty += r["Qty Sold"];
      if (r["Overall SOV"] > 0) { e.sov += r["Overall SOV"]; e.n += 1; }
      m.set(r.Date, e);
    });
    return [...m.values()].sort((a, b) => a.date.localeCompare(b.date)).map((e) => ({ ...e, sov: e.n ? e.sov / e.n : 0 }));
  }, [rows]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="Sales by City" subtitle="MRP value across the network">
        <ResponsiveContainer>
          <BarChart data={byCity} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="city" tick={axisTick} />
            <YAxis tickFormatter={(v) => fmtINR(v)} tick={axisTick} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n) => (n === "sales" ? fmtINR(v) : fmtNum(v))} />
            <Bar dataKey="sales" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Top 10 Brands" subtitle="Sales (MRP) leaderboard">
        <ResponsiveContainer>
          <BarChart data={byBrand} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => fmtINR(v)} tick={axisTick} />
            <YAxis type="category" dataKey="brand" width={110} tick={axisTick} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtINR(v)} />
            <Bar dataKey="sales" fill="var(--color-accent)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Category Mix" subtitle="Share of Sales (MRP)">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2} stroke="var(--background)" strokeWidth={2}>
              {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtINR(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Daily Pulse" subtitle="Sales, Qty and SOV by date">
        <ResponsiveContainer>
          <LineChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="date" tick={axisTick} />
            <YAxis yAxisId="l" tickFormatter={(v) => fmtINR(v)} tick={axisTick} />
            <YAxis yAxisId="r" orientation="right" tickFormatter={(v) => fmtPct(v)} tick={axisTick} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="l" type="monotone" dataKey="sales" stroke="var(--color-chart-1)" strokeWidth={2.5} dot />
            <Line yAxisId="r" type="monotone" dataKey="sov" stroke="var(--color-accent)" strokeWidth={2.5} dot />
          </LineChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

// ───────────────────────── Heatmap ─────────────────────────
type Metric = "sales" | "osa" | "discount" | "sov";
function CityHeatmap({ rows }: { rows: Row[] }) {
  const grid = useMemo(() => {
    const cats = Array.from(new Set(rows.map((r) => r.Category))).sort();
    const cities = DIMS.cities;
    const map = new Map<string, { sales: number; osa: number; osaN: number; disc: number; discN: number; sov: number; sovN: number }>();
    rows.forEach((r) => {
      const key = `${r.Category}__${r.City}`;
      const e = map.get(key) ?? { sales: 0, osa: 0, osaN: 0, disc: 0, discN: 0, sov: 0, sovN: 0 };
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
    const max = Math.max(...grid.cats.flatMap((c) => grid.cities.map((ci) => get(c, ci, m))), 0.0001);
    return (
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold tracking-tight mb-3">{title}</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th className="text-left text-muted-foreground font-medium px-2 py-1">Category</th>
                {grid.cities.map((ci) => (
                  <th key={ci} className="text-center text-muted-foreground font-medium px-1.5 py-1">{ci}</th>
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
                          backgroundColor: `color-mix(in oklch, ${color} ${Math.round(intensity * 70)}%, var(--heatmap-base))`,
                          color: intensity > 0.55 ? "var(--primary-foreground)" : "var(--foreground)",
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

// ───────────────────────── SKU Table ─────────────────────────
type Agg = {
  sku: string; brand: string; category: string; grammage: string;
  cities: number; sales: number; qty: number; osa: number; disc: number; sov: number;
};
type Key = keyof Agg;

function SkuTable({ rows }: { rows: Row[] }) {
  const [sort, setSort] = useState<{ k: Key; dir: "asc" | "desc" }>({ k: "sales", dir: "desc" });
  const [limit, setLimit] = useState(25);

  const data: Agg[] = useMemo(() => {
    const m = new Map<string, Agg & { osaN: number; discN: number; sovN: number; citySet: Set<string> }>();
    rows.forEach((r) => {
      const key = r["SKU Name"] + "||" + r.Brand;
      const e = m.get(key) ?? {
        sku: r["SKU Name"], brand: r.Brand, category: r.Category, grammage: r.Grammage,
        cities: 0, sales: 0, qty: 0, osa: 0, disc: 0, sov: 0,
        osaN: 0, discN: 0, sovN: 0, citySet: new Set<string>(),
      };
      e.sales += r["Sales (MRP)"]; e.qty += r["Qty Sold"]; e.citySet.add(r.City);
      if (r["Avg. OSA %"] > 0) { e.osa += r["Avg. OSA %"]; e.osaN += 1; }
      if (r.MRP > 0) { e.disc += r["Discount %"]; e.discN += 1; }
      if (r["Overall SOV"] > 0) { e.sov += r["Overall SOV"]; e.sovN += 1; }
      m.set(key, e);
    });
    return [...m.values()].map((e) => ({
      sku: e.sku, brand: e.brand, category: e.category, grammage: e.grammage,
      cities: e.citySet.size, sales: e.sales, qty: e.qty,
      osa: e.osaN ? e.osa / e.osaN : 0,
      disc: e.discN ? e.disc / e.discN : 0,
      sov: e.sovN ? e.sov / e.sovN : 0,
    }));
  }, [rows]);

  const sorted = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = a[sort.k], bv = b[sort.k];
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
  }, [data, sort]);

  const toggle = (k: Key) =>
    setSort((s) => (s.k === k ? { k, dir: s.dir === "asc" ? "desc" : "asc" } : { k, dir: "desc" }));

  const Hdr = ({ k, children, align = "left" }: { k: Key; children: React.ReactNode; align?: "left" | "right" }) => (
    <th onClick={() => toggle(k)} className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground select-none ${align === "right" ? "text-right" : "text-left"}`}>
      <span className={`inline-flex items-center gap-1 ${align === "right" ? "flex-row-reverse" : ""}`}>
        {children}
        {sort.k === k ? (sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
      </span>
    </th>
  );

  const visible = sorted.slice(0, limit);
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-baseline justify-between p-5 pb-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">SKU Performance</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{fmtNum(sorted.length)} SKUs · showing top {Math.min(limit, sorted.length)}</p>
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
              <tr key={r.sku + i} className="border-b border-border/40 hover:bg-secondary/30 transition">
                <td className="px-3 py-2.5 text-sm max-w-[320px] truncate font-medium" title={r.sku}>{r.sku}</td>
                <td className="px-3 py-2.5 text-sm text-muted-foreground">{r.brand}</td>
                <td className="px-3 py-2.5 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-secondary border border-border/60">{r.category}</span>
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
              <tr><td colSpan={9} className="px-3 py-12 text-center text-muted-foreground text-sm">No SKUs match the current filters</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {limit < sorted.length && (
        <div className="p-4 text-center border-t border-border/40">
          <button onClick={() => setLimit((l) => l + 50)} className="text-sm font-medium text-primary hover:text-primary/80 transition">
            Show 50 more →
          </button>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Dashboard ─────────────────────────
type Filters = {
  dates: string[]; brands: string[]; categories: string[]; cities: string[]; search: string;
};
const DEFAULTS: Filters = {
  dates: [...DIMS.dates],
  brands: DIMS.brands.includes(RIO_BRAND) ? [RIO_BRAND] : [],
  categories: [], cities: [], search: "",
};

function Dashboard() {
  const { theme, toggle: toggleTheme } = useTheme();
  const [filters, setFilters] = useState<Filters>(DEFAULTS);

  const filtered: Row[] = useMemo(() => {
    const s = filters.search.trim().toLowerCase();
    return DATA.filter((r) => {
      if (filters.dates.length && !filters.dates.includes(r.Date)) return false;
      if (filters.brands.length && !filters.brands.includes(r.Brand)) return false;
      if (filters.categories.length && !filters.categories.includes(r.Category)) return false;
      if (filters.cities.length && !filters.cities.includes(r.City)) return false;
      if (s && !r["SKU Name"].toLowerCase().includes(s) && !r.Brand.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [filters]);

  const categoryUniverse: Row[] = useMemo(() => {
    const cats = new Set(filters.categories.length ? filters.categories : filtered.map((r) => r.Category));
    return DATA.filter(
      (r) =>
        cats.has(r.Category) &&
        (!filters.dates.length || filters.dates.includes(r.Date)) &&
        (!filters.cities.length || filters.cities.includes(r.City)),
    );
  }, [filters, filtered]);

  const kpi = useMemo(() => {
    const salesMRP = filtered.reduce((s, r) => s + r["Sales (MRP)"], 0);
    const salesSP = filtered.reduce((s, r) => s + r["Sales (SP)"], 0);
    const qty = filtered.reduce((s, r) => s + r["Qty Sold"], 0);
    const universeMRP = categoryUniverse.reduce((s, r) => s + r["Sales (MRP)"], 0);
    const share = universeMRP > 0 ? (salesMRP / universeMRP) * 100 : 0;
    const osaRows = filtered.filter((r) => r["Avg. OSA %"] > 0);
    const osa = osaRows.length ? osaRows.reduce((s, r) => s + r["Avg. OSA %"], 0) / osaRows.length : 0;
    const discRows = filtered.filter((r) => r.MRP > 0);
    const disc = discRows.length ? discRows.reduce((s, r) => s + r["Discount %"], 0) / discRows.length : 0;
    const sovRows = filtered.filter((r) => r["Overall SOV"] > 0);
    const sov = sovRows.length ? sovRows.reduce((s, r) => s + r["Overall SOV"], 0) / sovRows.length : 0;
    const skus = new Set(filtered.map((r) => r["SKU Name"])).size;
    return { salesMRP, salesSP, qty, share, osa, disc, sov, skus };
  }, [filtered, categoryUniverse]);

  const reset = () => setFilters(DEFAULTS);
  const activeChips = [
    ...filters.brands.map((v) => ({ k: "brands" as const, v })),
    ...filters.categories.map((v) => ({ k: "categories" as const, v })),
    ...filters.cities.map((v) => ({ k: "cities" as const, v })),
    ...(filters.dates.length !== DIMS.dates.length ? filters.dates.map((v) => ({ k: "dates" as const, v })) : []),
  ];

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b border-border/50 backdrop-blur-xl bg-background/70">
        <div className="mx-auto max-w-[1600px] px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center metric-glow">
              <Activity className="size-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">Quick Comm Intel</div>
              <h1 className="text-xl font-bold leading-tight">RIO · Zepto Command Center</h1>
            </div>
          </div>
          <div className="flex-1" />
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search SKU or brand…"
              className="pl-9 bg-secondary/50 border-border/60"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={reset} className="gap-2">
            <RefreshCw className="size-3.5" />
            Reset
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 pt-6 space-y-6">
        <div className="glass-card rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <MultiSelect icon={Calendar} label="Date" options={DIMS.dates} selected={filters.dates}
            onChange={(dates) => setFilters((f) => ({ ...f, dates }))} />
          <MultiSelect icon={Building2} label="Brand" options={DIMS.brands} selected={filters.brands}
            onChange={(brands) => setFilters((f) => ({ ...f, brands }))} searchable />
          <MultiSelect icon={Layers} label="Category" options={DIMS.categories} selected={filters.categories}
            onChange={(categories) => setFilters((f) => ({ ...f, categories }))} />
          <MultiSelect icon={MapPin} label="City" options={DIMS.cities} selected={filters.cities}
            onChange={(cities) => setFilters((f) => ({ ...f, cities }))} />
        </div>

        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Active</span>
            {activeChips.map(({ k, v }) => (
              <button
                key={`${k}-${v}`}
                onClick={() => setFilters((f) => ({ ...f, [k]: f[k].filter((x) => x !== v) }))}
                className="group inline-flex items-center gap-1.5 rounded-full bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 px-3 py-1 text-xs font-medium transition"
              >
                <span className="text-muted-foreground/80">{k.slice(0, -1)}:</span>
                {v}
                <X className="size-3 opacity-60 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        )}

        {filters.brands.includes(RIO_BRAND) && (
          <div className="glass-card rounded-2xl px-5 py-3 flex items-center gap-3">
            <Sparkles className="size-4 text-accent" />
            <div className="text-sm">
              Showing <span className="font-semibold text-foreground">RIO</span> performance across
              <span className="font-semibold text-foreground"> {DIMS.cities.length} cities</span> ·
              benchmarked against full category universe
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Kpi label="Sales (MRP)" value={fmtINR(kpi.salesMRP)} sub={`Net ${fmtINR(kpi.salesSP)}`} icon={TrendingUp} />
          <Kpi label="Units Sold" value={fmtNum(kpi.qty)} icon={ShoppingCart} accent="var(--color-chart-4)" />
          <Kpi label="Category Share" value={fmtPct(kpi.share)} sub="of MRP universe" icon={Tags} accent="var(--color-chart-2)" />
          <Kpi label="Avg OSA" value={fmtPct(kpi.osa)} sub="On-shelf availability" icon={Package} accent="var(--color-chart-3)" />
          <Kpi label="Avg Discount" value={fmtPct(kpi.disc)} sub="MRP → SP" icon={Percent} accent="var(--color-chart-5)" />
          <Kpi label="Avg SOV" value={fmtPct(kpi.sov, 2)} sub={`${fmtNum(kpi.skus)} SKUs`} icon={Eye} accent="var(--color-accent)" />
        </div>

        <ChartsGrid rows={filtered} />
        <CityHeatmap rows={filtered} />
        <SkuTable rows={filtered} />

        <footer className="pt-6 text-center text-xs text-muted-foreground">
          {filtered.length.toLocaleString("en-IN")} rows · {DATA.length.toLocaleString("en-IN")} total ·
          Data window {DIMS.dates[0]} → {DIMS.dates[DIMS.dates.length - 1]}
        </footer>
      </main>
    </div>
  );
}
