import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import type { Row } from "@/lib/dashboard-data";
import { fmtINR, fmtNum, fmtPct } from "@/lib/format";

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-accent)",
];

function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass-card rounded-2xl p-5 ${className}`}>
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

const tooltipStyle = {
  backgroundColor: "oklch(0.22 0.025 250)",
  border: "1px solid oklch(0.35 0.03 250)",
  borderRadius: 8,
  fontSize: 12,
  color: "oklch(0.97 0.005 250)",
};

export function ChartsGrid({ rows }: { rows: Row[] }) {
  const byCity = useMemo(() => {
    const m = new Map<string, { city: string; sales: number; qty: number }>();
    rows.forEach((r) => {
      const e = m.get(r.City) ?? { city: r.City, sales: 0, qty: 0 };
      e.sales += r["Sales (MRP)"];
      e.qty += r["Qty Sold"];
      m.set(r.City, e);
    });
    return [...m.values()].sort((a, b) => b.sales - a.sales);
  }, [rows]);

  const byBrand = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(r.Brand, (m.get(r.Brand) ?? 0) + r["Sales (MRP)"]));
    return [...m.entries()]
      .map(([brand, sales]) => ({ brand, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
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
      e.sales += r["Sales (MRP)"];
      e.qty += r["Qty Sold"];
      if (r["Overall SOV"] > 0) {
        e.sov += r["Overall SOV"];
        e.n += 1;
      }
      m.set(r.Date, e);
    });
    return [...m.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({ ...e, sov: e.n ? e.sov / e.n : 0 }));
  }, [rows]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="Sales by City" subtitle="MRP value across the network">
        <ResponsiveContainer>
          <BarChart data={byCity} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.03 250)" />
            <XAxis dataKey="city" tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 11 }} />
            <YAxis tickFormatter={(v) => fmtINR(v)} tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 11 }} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, n) => (n === "sales" ? fmtINR(v) : fmtNum(v))}
            />
            <Bar dataKey="sales" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Top 10 Brands" subtitle="Sales (MRP) leaderboard">
        <ResponsiveContainer>
          <BarChart
            data={byBrand}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.03 250)" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => fmtINR(v)} tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 11 }} />
            <YAxis type="category" dataKey="brand" width={110} tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtINR(v)} />
            <Bar dataKey="sales" fill="var(--color-accent)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Category Mix" subtitle="Share of Sales (MRP)">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={byCategory}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              stroke="oklch(0.18 0.02 250)"
              strokeWidth={2}
            >
              {byCategory.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtINR(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Daily Pulse" subtitle="Sales, Qty and SOV by date">
        <ResponsiveContainer>
          <LineChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.03 250)" />
            <XAxis dataKey="date" tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 11 }} />
            <YAxis yAxisId="l" tickFormatter={(v) => fmtINR(v)} tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 11 }} />
            <YAxis yAxisId="r" orientation="right" tickFormatter={(v) => fmtPct(v)} tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 11 }} />
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
