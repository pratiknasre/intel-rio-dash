import { useState } from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function MultiSelect({
  label,
  icon: Icon,
  options,
  selected,
  onChange,
  searchable,
}: {
  label: string;
  icon: LucideIcon;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  searchable?: boolean;
}) {
  const [q, setQ] = useState("");
  const filtered = q
    ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase()))
    : options;
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  const summary =
    selected.length === 0
      ? "All"
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="group flex items-center gap-2.5 w-full rounded-xl border border-border/60 bg-secondary/40 hover:bg-secondary/70 transition px-3.5 py-2.5 text-left">
          <Icon className="size-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              {label}
            </div>
            <div className="text-sm font-medium truncate">{summary}</div>
          </div>
          <ChevronDown className="size-4 text-muted-foreground group-hover:text-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 p-0 bg-popover border-border"
      >
        {searchable && (
          <div className="p-2 border-b border-border">
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="h-8 bg-secondary/50"
            />
          </div>
        )}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border text-xs">
          <span className="text-muted-foreground">
            {selected.length}/{options.length}
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => onChange(options)}
            >
              All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => onChange([])}
            >
              Clear
            </Button>
          </div>
        </div>
        <div className="max-h-72 overflow-auto py-1">
          {filtered.map((o) => {
            const on = selected.includes(o);
            return (
              <button
                key={o}
                onClick={() => toggle(o)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-secondary/70 text-left"
              >
                <span
                  className={`size-4 rounded border grid place-items-center transition ${
                    on
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border bg-secondary"
                  }`}
                >
                  {on && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span className="truncate">{o}</span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              No matches
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
