import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PdfVerifier from "@/components/PdfVerifier";

export default async function VerificarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessionId = Number(id);

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/pedido/${sessionId}`} className="flex items-center justify-center h-9 w-9 rounded-full bg-card border border-border">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-bold text-foreground">Verificar PDF</h1>
      </div>
      <PdfVerifier sessionId={sessionId} />
    </div>
  );
}
