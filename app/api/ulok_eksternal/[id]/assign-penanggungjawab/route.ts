import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, POSITION } from "@/lib/auth/acl";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  penanggungjawab: z.string().uuid().nullable(), // bisa null untuk unassign
  description: z.string().max(500).optional().nullable(),
});

function decodeError(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "message" in detail) {
    // Supabase error object
    // @ts-expect-error dynamic
    return detail.message || "Unknown database error";
  }
  return "Unknown error";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  try {
    const me = await getCurrentUser();
    if (!me) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Role check (mirroring logic but still validated again inside RPC)
    const isManager = me.position_nama === POSITION.LOCATION_MANAGER;

    if (!isManager) {
      return NextResponse.json(
        { success: false, error: "Forbidden: hanya LM / BM" },
        { status: 403 }
      );
    }

    // Sebelum assign LS, pastikan Ulok Eksternal ini milik cabang Manager yang login
    const { data: ulokMeta, error: metaErr } = await supabase
      .from("ulok_eksternal")
      .select("branch_id")
      .eq("id", params.id)
      .single();

    if (metaErr || !ulokMeta) {
      return NextResponse.json({ error: "Ulok not found" }, { status: 404 });
    }

    // Jika user terikat cabang (LM), wajib match
    if (me.branch_id && ulokMeta.branch_id !== me.branch_id) {
      return NextResponse.json(
        { error: "Forbidden: Anda tidak dapat mengubah data cabang lain" },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Body harus JSON" },
        { status: 400 }
      );
    }

    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json({ success: false, error: msg }, { status: 422 });
    }

    const { penanggungjawab, description } = parsed.data;

    const { data, error } = await supabase.rpc(
      "fn_ulok_eksternal_assign_penanggungjawab",
      {
        p_actor_user_id: me.id,
        p_ulok_eksternal_id: params.id,
        p_new_penanggungjawab: penanggungjawab,
        p_description: description ?? null,
      }
    );

    if (error) {
      return NextResponse.json(
        { success: false, error: decodeError(error) },
        { status: 400 }
      );
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { success: false, error: "Unexpected RPC response" },
        { status: 500 }
      );
    }

    // Define the expected RPC response type
    type RpcResponse = {
      success: boolean;
      error?: string;
      [key: string]: unknown;
    };

    const rpcData = data as RpcResponse;

    // Jika RPC sudah mengembalikan success=false di payload
    if (rpcData.success === false) {
      return NextResponse.json(
        { success: false, error: rpcData.error || "RPC error" },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Internal error",
      },
      { status: 500 }
    );
  }
}
