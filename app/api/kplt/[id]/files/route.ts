import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const qs = req.nextUrl.search; // pertahankan query params
  return NextResponse.redirect(
    new URL(`/api/files/kplt/${params.id}${qs}`, req.url),
    307
  );
}
