import type { Row } from "./sheet";

// Brand that represents "us" in the competitive set.
export const RIO_BRAND = "Enjoyrio";

// ───────────────────────── Types ─────────────────────────
export type InsightTone = "positive" | "negative" | "neutral" | "watch";
export type InsightGroup =
  | "Position"
  | "Momentum"
  | "Availability"
  | "Pricing"
  | "Competition"
  | "Coverage";

export type Insight = {
  id: string;
  group: InsightGroup;
  tone: InsightTone;
  headline: string; // short, scannable
  detail: string; // one supporting sentence
  metric?: string; // optional big value, e.g. "12.4%"
  delta?: number; // signed change vs comparison period (pts or %)
  deltaUnit?: "pts" | "%" | "₹";
  priority: number; // higher = surfaced first
};

export type InsightsResult = {
  insights: Insight[];
  meta: {
    latest: string | null;
    previous: string | null;
    dateCount: number;
    brandCount: number;
    categoryCount: number;
    cityCount: number;
    comparison: "day-over-day" | "snapshot";
  };
};

// ───────────────────────── Helpers ─────────────────────────
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const avg = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);
const rioRows = (rows: Row[]) => rows.filter((r) => r.Brand === RIO_BRAND);

type Metrics = {
  rioSales: number;
  marketSales: number;
  share: number; // %
  sov: number; // overall SOV avg
  organic: number;
  paid: number;
  osa: number;
  discount: number;
  asp: number; // ₹, SP-weighted
  qty: number;
};

function metricsFor(rows: Row[]): Metrics {
  const rio = rioRows(rows);
  const rioSales = sum(rio.map((r) => r["Sales (MRP)"]));
  const rioSalesSP = sum(rio.map((r) => r["Sales (SP)"]));
  const marketSales = sum(rows.map((r) => r["Sales (MRP)"]));
  const qty = sum(rio.map((r) => r["Qty Sold"]));
  return {
    rioSales,
    marketSales,
    share: marketSales > 0 ? (rioSales / marketSales) * 100 : 0,
    sov: avg(rio.filter((r) => r["Overall SOV"] > 0).map((r) => r["Overall SOV"])),
    organic: avg(rio.filter((r) => r["Organic SOV"] > 0).map((r) => r["Organic SOV"])),
    paid: avg(rio.filter((r) => r["Paid SOV"] > 0).map((r) => r["Paid SOV"])),
    osa: avg(rio.filter((r) => r["Avg. OSA %"] > 0).map((r) => r["Avg. OSA %"])),
    discount: avg(rio.filter((r) => r.MRP > 0).map((r) => r["Discount %"])),
    asp: qty > 0 ? rioSalesSP / qty : 0,
    qty,
  };
}

type CatStat = {
  cat: string;
  rioShare: number;
  rioSales: number;
  market: number;
  leader: string;
  leaderSales: number;
  rioRank: number; // 1-based; 0 if RIO absent
  brands: number;
};

function statsByCategory(rows: Row[]): CatStat[] {
  const cats = Array.from(new Set(rows.map((r) => r.Category)));
  return cats.map((cat) => {
    const cr = rows.filter((r) => r.Category === cat);
    const market = sum(cr.map((r) => r["Sales (MRP)"]));
    const byBrand = new Map<string, number>();
    cr.forEach((r) => byBrand.set(r.Brand, (byBrand.get(r.Brand) ?? 0) + r["Sales (MRP)"]));
    const ranked = [...byBrand.entries()].filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]);
    const rioSales = byBrand.get(RIO_BRAND) ?? 0;
    return {
      cat,
      rioShare: market > 0 ? (rioSales / market) * 100 : 0,
      rioSales,
      market,
      leader: ranked[0]?.[0] ?? "—",
      leaderSales: ranked[0]?.[1] ?? 0,
      rioRank: ranked.findIndex(([b]) => b === RIO_BRAND) + 1,
      brands: ranked.length,
    };
  });
}

// Average Overall SOV per brand (for movers / competition).
function sovByBrand(rows: Row[]): Map<string, number> {
  const acc = new Map<string, { s: number; n: number }>();
  rows.forEach((r) => {
    if (r["Overall SOV"] > 0) {
      const e = acc.get(r.Brand) ?? { s: 0, n: 0 };
      e.s += r["Overall SOV"];
      e.n += 1;
      acc.set(r.Brand, e);
    }
  });
  const out = new Map<string, number>();
  acc.forEach((v, k) => out.set(k, v.s / v.n));
  return out;
}

// RIO average OSA per city.
function rioOsaByCity(rows: Row[]): { city: string; osa: number }[] {
  const acc = new Map<string, { s: number; n: number }>();
  rioRows(rows).forEach((r) => {
    if (r["Avg. OSA %"] > 0) {
      const e = acc.get(r.City) ?? { s: 0, n: 0 };
      e.s += r["Avg. OSA %"];
      e.n += 1;
      acc.set(r.City, e);
    }
  });
  return [...acc.entries()].map(([city, v]) => ({ city, osa: v.s / v.n }));
}

const fmtPct = (n: number, d = 1) => `${n.toFixed(d)}%`;
const fmtINR = (n: number) => {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
};
const signed = (n: number, d = 1) => `${n >= 0 ? "+" : ""}${n.toFixed(d)}`;

// Tone from a delta where "up is good" (or inverted for cost-like metrics).
const toneFromDelta = (delta: number, upIsGood = true): InsightTone => {
  if (Math.abs(delta) < 1e-9) return "neutral";
  const good = upIsGood ? delta > 0 : delta < 0;
  return good ? "positive" : "negative";
};

const OSA_WATCH = 85; // RIO availability below this in a city is flagged

// ───────────────────────── Engine ─────────────────────────
export function generateInsights(all: Row[]): InsightsResult {
  const dates = Array.from(new Set(all.map((r) => r.Date))).sort();
  const latest = dates[dates.length - 1] ?? null;
  const previous = dates.length >= 2 ? dates[dates.length - 2] : null;
  const cur = latest ? all.filter((r) => r.Date === latest) : [];
  const prv = previous ? all.filter((r) => r.Date === previous) : [];

  const meta: InsightsResult["meta"] = {
    latest,
    previous,
    dateCount: dates.length,
    brandCount: new Set(all.map((r) => r.Brand)).size,
    categoryCount: new Set(all.map((r) => r.Category)).size,
    cityCount: new Set(all.map((r) => r.City)).size,
    comparison: previous ? "day-over-day" : "snapshot",
  };

  if (cur.length === 0) return { insights: [], meta };

  const m = metricsFor(cur);
  const pm = previous ? metricsFor(prv) : null;
  const out: Insight[] = [];

  // 1) Market share + momentum
  {
    const delta = pm ? m.share - pm.share : undefined;
    out.push({
      id: "share",
      group: "Position",
      tone: delta === undefined ? "neutral" : toneFromDelta(delta),
      headline: `RIO holds ${fmtPct(m.share)} market share`,
      detail:
        delta === undefined
          ? `RIO sales ${fmtINR(m.rioSales)} against a tracked market of ${fmtINR(m.marketSales)}.`
          : `${signed(delta)}pts vs previous day — RIO sales ${fmtINR(m.rioSales)} of ${fmtINR(m.marketSales)} market.`,
      metric: fmtPct(m.share),
      delta,
      deltaUnit: "pts",
      priority: 100 + (delta ? Math.min(Math.abs(delta) * 4, 40) : 0),
    });
  }

  // 2) Overall SOV + organic/paid split
  {
    const delta = pm ? m.sov - pm.sov : undefined;
    const split =
      m.sov > 0
        ? `Organic ${fmtPct(m.organic)} vs Paid ${fmtPct(m.paid)}.`
        : "No search visibility recorded.";
    out.push({
      id: "sov",
      group: "Momentum",
      tone: delta === undefined ? "neutral" : toneFromDelta(delta),
      headline: `Overall SOV at ${fmtPct(m.sov, 2)}`,
      detail: delta === undefined ? split : `${signed(delta, 2)}pts vs previous day. ${split}`,
      metric: fmtPct(m.sov, 2),
      delta,
      deltaUnit: "pts",
      priority: 90 + (delta ? Math.min(Math.abs(delta) * 6, 30) : 0),
    });
  }

  // 3) Availability watch — cities below threshold
  {
    const cityOsa = rioOsaByCity(cur).sort((a, b) => a.osa - b.osa);
    const weak = cityOsa.filter((c) => c.osa > 0 && c.osa < OSA_WATCH);
    if (weak.length > 0) {
      const names = weak.slice(0, 4).map((c) => `${c.city} (${fmtPct(c.osa, 0)})`);
      out.push({
        id: "osa-watch",
        group: "Availability",
        tone: "watch",
        headline: `Availability gap in ${weak.length} ${weak.length === 1 ? "city" : "cities"}`,
        detail: `RIO OSA below ${OSA_WATCH}% in ${names.join(", ")}${weak.length > 4 ? "…" : ""}.`,
        metric: fmtPct(weak[0].osa, 0),
        priority: 88 + Math.min(weak.length * 3, 20),
      });
    } else if (cityOsa.length > 0) {
      const overall = avg(cityOsa.map((c) => c.osa));
      out.push({
        id: "osa-ok",
        group: "Availability",
        tone: "positive",
        headline: `Availability healthy at ${fmtPct(overall, 0)}`,
        detail: `RIO OSA is at or above ${OSA_WATCH}% across all ${cityOsa.length} tracked cities.`,
        metric: fmtPct(overall, 0),
        priority: 60,
      });
    }
  }

  // 4) Pricing — discount vs market, and ASP move
  {
    const marketDisc = avg(cur.filter((r) => r.MRP > 0).map((r) => r["Discount %"]));
    const gap = m.discount - marketDisc;
    out.push({
      id: "discount",
      group: "Pricing",
      tone: "neutral",
      headline: `RIO discount ${fmtPct(m.discount)}`,
      detail: `${gap >= 0 ? `${fmtPct(gap)} deeper` : `${fmtPct(Math.abs(gap))} shallower`} than the market average of ${fmtPct(marketDisc)}.`,
      metric: fmtPct(m.discount),
      priority: 70,
    });
    if (pm && pm.asp > 0) {
      const delta = m.asp - pm.asp;
      if (Math.abs(delta) >= 0.5) {
        out.push({
          id: "asp",
          group: "Pricing",
          tone: "neutral",
          headline: `ASP ${delta >= 0 ? "rose" : "fell"} to ₹${m.asp.toFixed(0)}`,
          detail: `Average selling price moved ${signed(delta, 0)}₹ vs previous day.`,
          metric: `₹${m.asp.toFixed(0)}`,
          delta,
          deltaUnit: "₹",
          priority: 65 + Math.min(Math.abs(delta), 20),
        });
      }
    }
  }

  // 5) Best & weakest category for RIO
  {
    const cats = statsByCategory(cur).filter((c) => c.market > 0);
    const withRio = cats.filter((c) => c.rioSales > 0).sort((a, b) => b.rioShare - a.rioShare);
    if (withRio.length > 0) {
      const best = withRio[0];
      out.push({
        id: "cat-best",
        group: "Position",
        tone: "positive",
        headline: `Strongest in ${best.cat}`,
        detail: `RIO holds ${fmtPct(best.rioShare)} share there${best.rioRank ? `, ranked #${best.rioRank} of ${best.brands} brands` : ""}.`,
        metric: fmtPct(best.rioShare),
        priority: 78,
      });
      if (withRio.length > 1) {
        const worst = withRio[withRio.length - 1];
        out.push({
          id: "cat-worst",
          group: "Position",
          tone: "watch",
          headline: `Weakest in ${worst.cat}`,
          detail: `Only ${fmtPct(worst.rioShare)} share — ${worst.leader} leads with ${fmtINR(worst.leaderSales)}.`,
          metric: fmtPct(worst.rioShare),
          priority: 72,
        });
      }
    }
  }

  // 6) Competition — top rival by SOV in RIO's biggest category
  {
    const cats = statsByCategory(cur)
      .filter((c) => c.rioSales > 0)
      .sort((a, b) => b.rioSales - a.rioSales);
    const main = cats[0];
    if (main) {
      const catRows = cur.filter((r) => r.Category === main.cat);
      const sov = sovByBrand(catRows);
      const rivals = [...sov.entries()]
        .filter(([b]) => b !== RIO_BRAND)
        .sort((a, b) => b[1] - a[1]);
      const rioSov = sov.get(RIO_BRAND) ?? 0;
      if (rivals.length > 0) {
        const [rivalName, rivalSov] = rivals[0];
        out.push({
          id: "rival",
          group: "Competition",
          tone: rivalSov > rioSov ? "negative" : "positive",
          headline: `${rivalName} leads visibility in ${main.cat}`,
          detail: `${rivalName} at ${fmtPct(rivalSov, 2)} Overall SOV vs RIO ${fmtPct(rioSov, 2)}.`,
          metric: fmtPct(rivalSov, 2),
          priority: 76,
        });
      }
    }
  }

  // 7) Movers — biggest SOV gainer / loser day-over-day
  if (previous) {
    const now = sovByBrand(cur);
    const before = sovByBrand(prv);
    const deltas = [...now.entries()]
      .map(([b, v]) => ({ brand: b, delta: v - (before.get(b) ?? 0), now: v }))
      .filter((d) => before.has(d.brand) && Math.abs(d.delta) >= 0.1);
    const gainer = [...deltas].sort((a, b) => b.delta - a.delta)[0];
    const loser = [...deltas].sort((a, b) => a.delta - b.delta)[0];
    if (gainer && gainer.delta > 0) {
      out.push({
        id: "mover-up",
        group: "Momentum",
        tone: gainer.brand === RIO_BRAND ? "positive" : "neutral",
        headline: `${gainer.brand === RIO_BRAND ? "RIO" : gainer.brand} gained the most SOV`,
        detail: `${signed(gainer.delta, 2)}pts day-over-day, now at ${fmtPct(gainer.now, 2)}.`,
        metric: signed(gainer.delta, 2),
        delta: gainer.delta,
        deltaUnit: "pts",
        priority: 84,
      });
    }
    if (loser && loser.delta < 0 && loser.brand !== gainer?.brand) {
      out.push({
        id: "mover-down",
        group: "Momentum",
        tone: loser.brand === RIO_BRAND ? "negative" : "neutral",
        headline: `${loser.brand === RIO_BRAND ? "RIO" : loser.brand} lost the most SOV`,
        detail: `${signed(loser.delta, 2)}pts day-over-day, now at ${fmtPct(loser.now, 2)}.`,
        metric: signed(loser.delta, 2),
        delta: loser.delta,
        deltaUnit: "pts",
        priority: 82,
      });
    }
  }

  // 8) Coverage / data hygiene
  {
    out.push({
      id: "coverage",
      group: "Coverage",
      tone: "neutral",
      headline:
        meta.comparison === "day-over-day"
          ? `Comparing ${latest} vs ${previous}`
          : `Snapshot for ${latest}`,
      detail: `${meta.brandCount} brands · ${meta.categoryCount} categories · ${meta.cityCount} cities · ${meta.dateCount} day${meta.dateCount === 1 ? "" : "s"} of data.${meta.comparison === "snapshot" ? " Add more days to unlock trends & movers." : ""}`,
      priority: 10,
    });
  }

  out.sort((a, b) => b.priority - a.priority);
  return { insights: out, meta };
}
