import { getProducts, getFilterOptions } from "@/app/actions/catalogActions";
import { getCurrentUser } from "@/app/actions/authActions";
import CatalogoClient from "./CatalogoClient";
import { redirect } from "next/navigation";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ proveedor?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const providerId = parseInt(params.proveedor || "1");

  const [products, filterOptions] = await Promise.all([
    getProducts(providerId),
    getFilterOptions(providerId),
  ]);

  return (
    <CatalogoClient
      initialProducts={products}
      filterOptions={filterOptions}
      providerId={providerId}
      userId={user.id}
    />
  );
}
