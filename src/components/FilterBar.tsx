"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

type FilterOptions = {
  materials: { id: number; name: string }[];
  colors: { id: number; name: string; hex: string | null }[];
  genders: { id: number; name: string }[];
  cuts: { id: number; name: string }[];
  sizeGroups: { id: number; name: string; options: { id: number; name: string }[] }[];
};

interface FilterBarProps {
  options: FilterOptions;
  filters: { search: string; colorIds: number[]; materialIds: number[]; genderIds: number[]; cutIds: number[]; sizes: string[] };
  onFiltersChange: (filters: FilterBarProps["filters"]) => void;
}

export default function FilterBar({ options, filters, onFiltersChange }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const activeCount = filters.colorIds.length + filters.materialIds.length + filters.genderIds.length + filters.cutIds.length + filters.sizes.length;

  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  function clearAll() {
    onFiltersChange({ search: "", colorIds: [], materialIds: [], genderIds: [], cutIds: [], sizes: [] });
  }

  return (
    <div className="sticky top-0 z-40 bg-background">
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input type="text" placeholder="Buscar producto..." value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="w-full rounded-[12px] border border-border bg-input py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <button onClick={() => setOpen(!open)}
          className={`relative rounded-[12px] border p-2 transition-colors ${open || activeCount > 0 ? "border-primary bg-primary text-white" : "border-border bg-card text-secondary"}`}>
          <SlidersHorizontal size={18} />
          {activeCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">{activeCount}</span>}
        </button>
      </div>

      {open && (
        <div className="space-y-4 border-b border-border px-4 pb-4">
          {options.colors.length > 0 && (
            <div><span className="mb-1 block text-xs font-bold text-foreground">Color</span>
              <div className="flex flex-wrap gap-2">
                {options.colors.map((c) => (
                  <button key={c.id} onClick={() => onFiltersChange({ ...filters, colorIds: toggle(filters.colorIds, c.id) })}
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${filters.colorIds.includes(c.id) ? "scale-110 border-primary" : "border-border/50"}`}
                    style={{ backgroundColor: c.hex || "#ccc" }} title={c.name} />
                ))}
              </div>
            </div>
          )}
          {options.materials.length > 0 && (
            <div><span className="mb-1 block text-xs font-bold text-foreground">Material</span>
              <div className="flex flex-wrap gap-2">
                {options.materials.map((m) => (
                  <button key={m.id} onClick={() => onFiltersChange({ ...filters, materialIds: toggle(filters.materialIds, m.id) })}
                    className={`rounded-full border px-3 py-1 text-xs ${filters.materialIds.includes(m.id) ? "border-primary bg-primary text-white" : "border-border bg-card text-foreground"}`}>
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {options.genders.length > 0 && (
            <div><span className="mb-1 block text-xs font-bold text-foreground">Género</span>
              <div className="flex flex-wrap gap-2">
                {options.genders.map((g) => (
                  <button key={g.id} onClick={() => onFiltersChange({ ...filters, genderIds: toggle(filters.genderIds, g.id) })}
                    className={`rounded-full border px-3 py-1 text-xs ${filters.genderIds.includes(g.id) ? "border-primary bg-primary text-white" : "border-border bg-card text-foreground"}`}>
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {options.cuts.length > 0 && (
            <div><span className="mb-1 block text-xs font-bold text-foreground">Corte</span>
              <div className="flex flex-wrap gap-2">
                {options.cuts.map((c) => (
                  <button key={c.id} onClick={() => onFiltersChange({ ...filters, cutIds: toggle(filters.cutIds, c.id) })}
                    className={`rounded-full border px-3 py-1 text-xs ${filters.cutIds.includes(c.id) ? "border-primary bg-primary text-white" : "border-border bg-card text-foreground"}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {options.sizeGroups.length > 0 && (
            <div><span className="mb-1 block text-xs font-bold text-foreground">Tallas</span>
              {options.sizeGroups.map((group) => (
                <div key={group.id} className="mb-2">
                  <span className="text-[10px] font-bold uppercase text-secondary">{group.name}</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {group.options.map((size) => (
                      <button key={size.id} onClick={() => onFiltersChange({ ...filters, sizes: toggle(filters.sizes, size.name) })}
                        className={`rounded-full border px-3 py-0.5 text-[10px] ${filters.sizes.includes(size.name) ? "border-primary bg-primary text-white" : "border-border bg-card text-foreground"}`}>
                        {size.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeCount > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1 text-xs text-error">
              <X size={12} /> Limpiar filtros ({activeCount})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
