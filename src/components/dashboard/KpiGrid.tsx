import { useMemo } from "react";
import type { Row } from "@/lib/dashboard-data";
import { fmtINR, fmtNum, fmtPct } from "@/lib/format";
import { TrendingUp, ShoppingCart, Package, Percent, Eye, Tags } from "lucide-react";

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
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
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
            {label}
          </div>
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

export function KpiGrid({ rows, universe }: { rows: Row[]; universe: Row[] }) {
  const k = useMemo(() => {
    const salesMRP = rows.reduce((s, r) => s + r["Sales (MRP)"], 0);
    const salesSP = rows.reduce((s, r) => s + r["Sales (SP)"], 0);
    const qty = rows.reduce((s, r) => s + r["Qty Sold"], 0);
    const universeMRP = universe.reduce((s, r) => s + r["Sales (MRP)"], 0);
    const share = universeMRP > 0 ? (salesMRP / universeMRP) * 100 : 0;
    const osaRows = rows.filter((r) => r["Avg. OSA %"] > 0);
    const osa = osaRows.length
      ? osaRows.reduce((s, r) => s + r["Avg. OSA %"], 0) / osaRows.length
      : 0;
    const discRows = rows.filter((r) => r.MRP > 0);
    const disc = discRows.length
      ? discRows.reduce((s, r) => s + r["Discount %"], 0) / discRows.length
      : 0;
    const sovRows = rows.filter((r) => r["Overall SOV"] > 0);
    const sov = sovRows.length
      ? sovRows.reduce((s, r) => s + r["Overall SOV"], 0) / sovRows.length
      : 0;
    const skus = new Set(rows.map((r) => r["SKU Name"])).size;
    return { salesMRP, salesSP, qty, share, osa, disc, sov, skus };
  }, [rows, universe]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <Kpi label="Sales (MRP)" value={fmtINR(k.salesMRP)} sub={`Net ${fmtINR(k.salesSP)}`} icon={TrendingUp} />
      <Kpi label="Units Sold" value={fmtNum(k.qty)} icon={ShoppingCart} accent="var(--color-chart-4)" />
      <Kpi label="Category Share" value={fmtPct(k.share)} sub="of MRP universe" icon={Tags} accent="var(--color-chart-2)" />
      <Kpi label="Avg OSA" value={fmtPct(k.osa)} sub="On-shelf availability" icon={Package} accent="var(--color-chart-3)" />
      <Kpi label="Avg Discount" value={fmtPct(k.disc)} sub="MRP → SP" icon={Percent} accent="var(--color-chart-5)" />
      <Kpi label="Avg SOV" value={fmtPct(k.sov, 2)} sub={`${fmtNum(k.skus)} SKUs`} icon={Eye} accent="var(--color-accent)" />
    </div>
  );
}
