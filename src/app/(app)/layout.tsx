import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/authActions";
import MobileNav from "@/components/MobileNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh pb-16">
      {children}
      <MobileNav isAdmin={user.role === "ADMIN"} />
    </div>
  );
}
