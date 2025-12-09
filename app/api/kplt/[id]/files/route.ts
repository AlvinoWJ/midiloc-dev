import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const qs = req.nextUrl.search; // pertahankan query params
  return NextResponse.redirect(
    new URL(`/api/files/kplt/${id}${qs}`, req.url),
    307
  );
}
