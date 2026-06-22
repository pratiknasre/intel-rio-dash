import { DIMS } from "@/lib/dashboard-data";
import type { Filters } from "./Dashboard";
import { MultiSelect } from "./MultiSelect";
import { Calendar, Building2, Layers, MapPin } from "lucide-react";

export function FilterBar({
  filters,
  setFilters,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
      <MultiSelect
        icon={Calendar}
        label="Date"
        options={DIMS.dates}
        selected={filters.dates}
        onChange={(dates) => setFilters((f) => ({ ...f, dates }))}
      />
      <MultiSelect
        icon={Building2}
        label="Brand"
        options={DIMS.brands}
        selected={filters.brands}
        onChange={(brands) => setFilters((f) => ({ ...f, brands }))}
        searchable
      />
      <MultiSelect
        icon={Layers}
        label="Category"
        options={DIMS.categories}
        selected={filters.categories}
        onChange={(categories) => setFilters((f) => ({ ...f, categories }))}
      />
      <MultiSelect
        icon={MapPin}
        label="City"
        options={DIMS.cities}
        selected={filters.cities}
        onChange={(cities) => setFilters((f) => ({ ...f, cities }))}
      />
    </div>
  );
}
