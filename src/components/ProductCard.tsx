"use client";

import { useState } from "react";
import SizeWeightGrid from "./SizeWeightGrid";

type Product = {
  id: number;
  name: string;
  imageUrl: string | null;
  catalogCode: string | null;
  material: { id: number; name: string; iconUrl: string | null } | null;
  color: { id: number; name: string; hex: string | null; imageUrl: string | null } | null;
  gender: { id: number; name: string; iconUrl: string | null } | null;
  brand: { id: number; name: string } | null;
  cut: { id: number; name: string } | null;
  variants: { id: number; size: string; basePrice: number; weightId: number | null; weight: { id: number; name: string } | null }[];
};

interface ProductCardProps {
  product: Product;
  orderQuantities: Map<number, number>;
  onIncrement: (variantId: number) => void;
  onDecrement: (variantId: number) => void;
  onSetQuantity: (variantId: number, qty: number) => void;
}

export default function ProductCard({ product, orderQuantities, onIncrement, onDecrement, onSetQuantity }: ProductCardProps) {
  const [expanded, setExpanded] = useState(false);
  const colorHex = product.color?.hex || "#cccccc";
  const totalPieces = product.variants.reduce((sum, v) => sum + (orderQuantities.get(v.id) || 0), 0);
  const totalCost = product.variants.reduce((sum, v) => sum + (orderQuantities.get(v.id) || 0) * v.basePrice, 0);

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-card shadow-sm">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center gap-3 p-3 text-left">
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
          {product.imageUrl || product.color?.imageUrl ? (
            <img src={product.imageUrl || product.color?.imageUrl || ""} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: colorHex }}>
              <svg viewBox="0 0 40 40" className="h-8 w-8 opacity-50">
                <path d="M10 8 L16 4 L24 4 L30 8 L32 16 L28 36 L12 36 L8 16 Z" fill="white" fillOpacity="0.3" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full border border-border/50" style={{ backgroundColor: colorHex }} />
            <span className="text-sm font-bold text-foreground truncate">{product.color?.name || "Sin color"}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-secondary">
            {product.material && <span>{product.material.name}</span>}
            {product.cut && <span>&middot; {product.cut.name}</span>}
            {product.gender && <span>&middot; {product.gender.name}</span>}
          </div>
          {product.catalogCode && <span className="text-[10px] text-secondary/70">{product.catalogCode}</span>}
        </div>
        {totalPieces > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-primary">{totalPieces}</span>
            <span className="text-[10px] text-secondary">pzs</span>
          </div>
        )}
      </button>

      {expanded && (
        <div className="border-t border-border px-3 pb-3 pt-2">
          <SizeWeightGrid variants={product.variants} orderQuantities={orderQuantities} onIncrement={onIncrement} onDecrement={onDecrement} onSetQuantity={onSetQuantity} />
          {totalPieces > 0 && (
            <div className="mt-2 flex items-center justify-between rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: colorHex, color: isLightColor(colorHex) ? "#221B16" : "#FFFFFF" }}>
              <span className="font-bold">{totalPieces} piezas</span>
              <span className="font-bold">${totalCost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
