import { useMemo, useState } from "react";
import { Activity, Search, X, Sparkles, RefreshCw } from "lucide-react";
import { DATA, DIMS, RIO_BRAND, type Row } from "@/lib/dashboard-data";
import { KpiGrid } from "./KpiGrid";
import { FilterBar } from "./FilterBar";
import { ChartsGrid } from "./ChartsGrid";
import { SkuTable } from "./SkuTable";
import { CityHeatmap } from "./CityHeatmap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type Filters = {
  dates: string[];
  brands: string[];
  categories: string[];
  cities: string[];
  search: string;
};

const DEFAULTS: Filters = {
  dates: [...DIMS.dates],
  brands: DIMS.brands.includes(RIO_BRAND) ? [RIO_BRAND] : [],
  categories: [],
  cities: [],
  search: "",
};

export function Dashboard() {
  const [filters, setFilters] = useState<Filters>(DEFAULTS);

  const filtered: Row[] = useMemo(() => {
    const s = filters.search.trim().toLowerCase();
    return DATA.filter((r) => {
      if (filters.dates.length && !filters.dates.includes(r.Date)) return false;
      if (filters.brands.length && !filters.brands.includes(r.Brand)) return false;
      if (filters.categories.length && !filters.categories.includes(r.Category)) return false;
      if (filters.cities.length && !filters.cities.includes(r.City)) return false;
      if (s && !r["SKU Name"].toLowerCase().includes(s) && !r.Brand.toLowerCase().includes(s))
        return false;
      return true;
    });
  }, [filters]);

  // Always compute the category universe (all brands) for share context
  const categoryUniverse: Row[] = useMemo(() => {
    const cats = new Set(
      filters.categories.length ? filters.categories : filtered.map((r) => r.Category),
    );
    return DATA.filter(
      (r) =>
        cats.has(r.Category) &&
        (!filters.dates.length || filters.dates.includes(r.Date)) &&
        (!filters.cities.length || filters.cities.includes(r.City)),
    );
  }, [filters, filtered]);

  const reset = () => setFilters(DEFAULTS);
  const activeChips = [
    ...filters.brands.map((v) => ({ k: "brands" as const, v })),
    ...filters.categories.map((v) => ({ k: "categories" as const, v })),
    ...filters.cities.map((v) => ({ k: "cities" as const, v })),
    ...(filters.dates.length !== DIMS.dates.length
      ? filters.dates.map((v) => ({ k: "dates" as const, v }))
      : []),
  ];

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/50 backdrop-blur-xl bg-background/70">
        <div className="mx-auto max-w-[1600px] px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center metric-glow">
              <Activity className="size-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">
                Quick Comm Intel
              </div>
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
          <Button variant="ghost" size="sm" onClick={reset} className="gap-2">
            <RefreshCw className="size-3.5" />
            Reset
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 pt-6 space-y-6">
        {/* Filter bar */}
        <FilterBar filters={filters} setFilters={setFilters} />

        {/* Active chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Active
            </span>
            {activeChips.map(({ k, v }) => (
              <button
                key={`${k}-${v}`}
                onClick={() =>
                  setFilters((f) => ({ ...f, [k]: f[k].filter((x) => x !== v) }))
                }
                className="group inline-flex items-center gap-1.5 rounded-full bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 px-3 py-1 text-xs font-medium transition"
              >
                <span className="text-muted-foreground/80">{k.slice(0, -1)}:</span>
                {v}
                <X className="size-3 opacity-60 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        )}

        {/* Brand banner if RIO selected */}
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

        <KpiGrid rows={filtered} universe={categoryUniverse} />

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
