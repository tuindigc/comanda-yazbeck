import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ProveedoresPage() {
  const providers = await prisma.provider.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return (
    <main className="p-4">
      <h1 className="mb-6 text-center text-2xl font-bold text-primary">Selecciona proveedor</h1>
      <div className="grid grid-cols-2 gap-4">
        {providers.map((provider) => (
          <Link key={provider.id} href={`/catalogo?proveedor=${provider.id}`}
            className="flex flex-col items-center gap-3 rounded-[12px] border border-border bg-card p-6 shadow-sm transition-shadow active:shadow-lg">
            {provider.logoUrl ? (
              <img src={provider.logoUrl} alt={provider.name} className="h-16 w-16 object-contain" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                {provider.name[0]}
              </div>
            )}
            <span className="text-sm font-bold text-foreground">{provider.name}</span>
          </Link>
        ))}
        {providers.length === 0 && (
          <p className="col-span-2 text-center text-secondary">No hay proveedores configurados</p>
        )}
      </div>
    </main>
  );
}
