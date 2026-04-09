import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/actions/authActions";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "Falta sessionId" }, { status: 400 });
  }

  return NextResponse.json(
    { error: "Comanda template not configured yet" },
    { status: 501 }
  );
}
