"use client";

import { useState } from "react";

type Variant = {
  id: number;
  size: string;
  weightId: number | null;
  weight: { id: number; name: string } | null;
  basePrice: number;
};

interface SizeWeightGridProps {
  variants: Variant[];
  orderQuantities: Map<number, number>;
  onIncrement: (variantId: number) => void;
  onDecrement: (variantId: number) => void;
  onSetQuantity: (variantId: number, qty: number) => void;
}

export default function SizeWeightGrid({ variants, orderQuantities, onIncrement, onDecrement, onSetQuantity }: SizeWeightGridProps) {
  const weights = [...new Map(variants.filter((v) => v.weight).map((v) => [v.weight!.id, v.weight!])).values()];
  const sizes = [...new Set(variants.map((v) => v.size))];
  const hasWeights = weights.length > 0;
  const variantMap = new Map(variants.map((v) => [`${v.size}-${v.weightId ?? "null"}`, v]));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="px-2 py-1 text-left font-bold text-foreground">Talla</th>
            {hasWeights ? weights.map((w) => (
              <th key={w.id} className="px-2 py-1 text-center font-bold text-foreground">{w.name}</th>
            )) : (
              <th className="px-2 py-1 text-center font-bold text-foreground">Cant.</th>
            )}
          </tr>
        </thead>
        <tbody>
          {sizes.map((size) => (
            <tr key={size} className="border-b border-border/50">
              <td className="px-2 py-1 font-bold text-foreground">{size}</td>
              {hasWeights ? weights.map((w) => {
                const variant = variantMap.get(`${size}-${w.id}`);
                if (!variant) return <td key={w.id} />;
                const qty = orderQuantities.get(variant.id) || 0;
                return (
                  <td key={w.id} className="px-1 py-1 text-center">
                    <QuantityCell qty={qty} onIncrement={() => onIncrement(variant.id)} onDecrement={() => onDecrement(variant.id)} onSet={(q) => onSetQuantity(variant.id, q)} />
                  </td>
                );
              }) : (() => {
                const variant = variantMap.get(`${size}-null`);
                if (!variant) return <td />;
                const qty = orderQuantities.get(variant.id) || 0;
                return (
                  <td className="px-1 py-1 text-center">
                    <QuantityCell qty={qty} onIncrement={() => onIncrement(variant.id)} onDecrement={() => onDecrement(variant.id)} onSet={(q) => onSetQuantity(variant.id, q)} />
                  </td>
                );
              })()}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuantityCell({ qty, onIncrement, onDecrement, onSet }: { qty: number; onIncrement: () => void; onDecrement: () => void; onSet: (q: number) => void }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <input type="number" min={0} defaultValue={qty} autoFocus
        className="w-12 rounded border border-primary bg-input px-1 py-0.5 text-center text-xs outline-none"
        onBlur={(e) => { onSet(parseInt(e.target.value) || 0); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      />
    );
  }

  return (
    <button onClick={onIncrement}
      onContextMenu={(e) => { e.preventDefault(); if (qty > 0) onDecrement(); }}
      onDoubleClick={() => setEditing(true)}
      className={`min-w-[2rem] rounded px-2 py-1 text-xs font-bold transition-colors ${qty > 0 ? "bg-primary text-white" : "bg-border/30 text-secondary"}`}>
      {qty || "\u00B7"}
    </button>
  );
}
