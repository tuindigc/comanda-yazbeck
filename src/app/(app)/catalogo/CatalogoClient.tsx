"use client";

import { useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import FilterBar from "@/components/FilterBar";
import { useOrder } from "@/components/OrderContext";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  imageUrl: string | null;
  catalogCode: string | null;
  material: { id: number; name: string; iconUrl: string | null } | null;
  color: { id: number; name: string; hex: string | null; imageUrl: string | null } | null;
  brand: { id: number; name: string } | null;
  gender: { id: number; name: string; iconUrl: string | null } | null;
  cut: { id: number; name: string } | null;
  variants: { id: number; size: string; basePrice: number; weightId: number | null; weight: { id: number; name: string } | null }[];
};

type FilterOptions = {
  materials: { id: number; name: string }[];
  colors: { id: number; name: string; hex: string | null }[];
  genders: { id: number; name: string }[];
  cuts: { id: number; name: string }[];
  sizeGroups: { id: number; name: string; options: { id: number; name: string }[] }[];
};

interface CatalogoClientProps {
  initialProducts: Product[];
  filterOptions: FilterOptions;
  providerId: number;
  userId: string;
}

export default function CatalogoClient({ initialProducts, filterOptions, providerId, userId }: CatalogoClientProps) {
  const { items, totalPieces, totalCost, increment, decrement, setQuantity } = useOrder();
  const orderQuantities = new Map<number, number>(
    Array.from(items.entries()).map(([id, item]) => [id, item.quantity])
  );

  const [filters, setFilters] = useState({
    search: "",
    colorIds: [] as number[],
    materialIds: [] as number[],
    genderIds: [] as number[],
    cutIds: [] as number[],
    sizes: [] as string[],
  });

  const [visibleCount, setVisibleCount] = useState(30);

  const filteredProducts = useMemo(() => {
    let result = initialProducts;

    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.color?.name.toLowerCase().includes(s) ||
          p.gender?.name.toLowerCase().includes(s)
      );
    }
    if (filters.colorIds.length) result = result.filter((p) => p.color ? filters.colorIds.includes(p.color.id) : false);
    if (filters.materialIds.length) result = result.filter((p) => p.material ? filters.materialIds.includes(p.material.id) : false);
    if (filters.genderIds.length) result = result.filter((p) => p.gender ? filters.genderIds.includes(p.gender.id) : false);
    if (filters.cutIds.length) result = result.filter((p) => p.cut ? filters.cutIds.includes(p.cut.id) : false);
    if (filters.sizes.length) result = result.filter((p) => p.variants.some((v) => filters.sizes.includes(v.size)));

    return result;
  }, [initialProducts, filters]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  function makeProductInfo(product: Product, variant: Product["variants"][0]) {
    return {
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      colorName: product.color?.name || "",
      colorHex: product.color?.hex || "#ccc",
      materialName: product.material?.name || "",
      genderName: product.gender?.name || "",
      cutName: product.cut?.name || "",
      size: variant.size,
      weightName: variant.weight?.name || "",
      unitCost: variant.basePrice,
      imageUrl: product.imageUrl || product.color?.imageUrl || "",
      catalogCode: product.catalogCode || "",
    };
  }

  return (
    <div className="relative">
      <FilterBar options={filterOptions} filters={filters} onFiltersChange={setFilters} />

      <div className="space-y-3 px-4 py-3">
        <p className="text-xs text-secondary">{filteredProducts.length} productos</p>

        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            orderQuantities={orderQuantities}
            onIncrement={(variantId) => {
              const variant = product.variants.find((v) => v.id === variantId)!;
              increment(variantId, makeProductInfo(product, variant));
            }}
            onDecrement={(variantId) => decrement(variantId)}
            onSetQuantity={(variantId, qty) => {
              const variant = product.variants.find((v) => v.id === variantId)!;
              setQuantity(variantId, qty, makeProductInfo(product, variant));
            }}
          />
        ))}

        {visibleCount < filteredProducts.length && (
          <button onClick={() => setVisibleCount((c) => c + 30)}
            className="w-full rounded-[12px] border border-border py-3 text-sm text-secondary">
            Ver más ({filteredProducts.length - visibleCount} restantes)
          </button>
        )}
      </div>

      {totalPieces > 0 && (
        <Link href="/pedido"
          className="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-between rounded-[12px] bg-primary px-4 py-3 text-white shadow-lg">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} />
            <span className="font-bold">{totalPieces} piezas</span>
          </div>
          <span className="font-bold">${totalCost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
        </Link>
      )}
    </div>
  );
}
