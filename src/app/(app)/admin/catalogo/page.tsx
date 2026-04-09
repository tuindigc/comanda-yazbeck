import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function AdminCatalogoPage() {
  const products = await prisma.product.findMany({
    include: {
      color: true,
      material: true,
      gender: true,
      cut: true,
      brand: true,
      _count: { select: { variants: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="flex items-center justify-center h-9 w-9 rounded-full bg-card border border-border">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-bold text-foreground flex-1">Catalogo</h1>
        <span className="text-sm text-secondary">{products.length} productos</span>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[12px] border border-border bg-card p-8 text-center">
          <p className="text-sm text-secondary">Sin productos registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => {
            const colorHex = product.color?.hex || "#cccccc";
            return (
              <div key={product.id} className="flex items-center gap-3 rounded-[12px] border border-border bg-card p-3">
                <span
                  className="inline-block h-5 w-5 rounded-full border border-border/50 flex-shrink-0"
                  style={{ backgroundColor: colorHex }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{product.name}</p>
                  <div className="flex flex-wrap gap-x-2 text-xs text-secondary">
                    {product.material && <span>{product.material.name}</span>}
                    {product.gender && <span>&middot; {product.gender.name}</span>}
                    {product.cut && <span>&middot; {product.cut.name}</span>}
                    {product.brand && <span>&middot; {product.brand.name}</span>}
                  </div>
                </div>
                <span className="text-xs text-secondary flex-shrink-0">{product._count.variants} var</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
