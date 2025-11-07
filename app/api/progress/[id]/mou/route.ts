import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canProgressKplt } from "@/lib/auth/acl";
import {
  MouCreateSchema,
  MouUpdateSchema,
  stripServerControlledFields,
} from "@/lib/validations/mou";
import type { PostgrestError } from "@supabase/supabase-js";

// GET /api/progress/[id]/mou
// - id = progress_kplt_id
// - Filter langsung ke branch user via embed: mou -> progress_kplt -> kplt
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canProgressKplt("read", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );

  const progressId = params?.id;
  if (!progressId)
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });

  // Ambil MOU untuk progress ini DAN pastikan berada di branch user
  const { data, error } = await supabase
    .from("mou")
    .select(
      `
      *,
      progress_kplt:progress_kplt!mou_progress_kplt_id_fkey!inner (
        id,
        kplt:kplt!progress_kplt_kplt_id_fkey!inner ( id, branch_id )
      )
      `
    )
    .eq("progress_kplt_id", progressId)
    .eq("progress_kplt.kplt.branch_id", user.branch_id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to load MOU", detail: error.message ?? error },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: "MOU not found" }, { status: 404 });
  }

  return NextResponse.json({ data }, { status: 200 });
}

// POST /api/progress/[id]/mou
// - id = progress_kplt_id
// - Tidak boleh set id/progress_kplt_id/final_status_mou dari client
// - Cek scope progress -> kplt.branch_id inline sebelum insert
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canProgressKplt("create", user) && !canProgressKplt("update", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );

  const progressId = params?.id;
  if (!progressId)
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });

  const body = await req.json().catch(() => ({}));
  if (
    "id" in body ||
    "progress_kplt_id" in body ||
    "final_status_mou" in body
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid payload: id/progress_kplt_id/final_status_mou are server-controlled",
      },
      { status: 400 }
    );
  }

  // Cek scope progress_kplt ke branch user (inline)
  {
    const { data: progress, error: scopeErr } = await supabase
      .from("progress_kplt")
      .select(
        `
        id,
        kplt:kplt!progress_kplt_kplt_id_fkey!inner ( id, branch_id )
        `
      )
      .eq("id", progressId)
      .eq("kplt.branch_id", user.branch_id)
      .maybeSingle();

    if (scopeErr) {
      return NextResponse.json(
        {
          error: "Failed to verify progress scope",
          detail: scopeErr.message ?? scopeErr,
        },
        { status: 500 }
      );
    }
    if (!progress) {
      return NextResponse.json(
        { error: "Progress not found or out of scope" },
        { status: 404 }
      );
    }
  }

  const parsed = MouCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", detail: parsed.error.issues },
      { status: 422 }
    );
  }

  const payload = {
    ...stripServerControlledFields(parsed.data),
    progress_kplt_id: progressId,
    updated_at: new Date().toISOString(),
  };

  //insert mou
  const { data, error } = await supabase
    .from("mou")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    const pgError = error as PostgrestError;
    const msg = pgError?.message ?? "";
    const code =
      pgError?.code ?? (msg.includes("duplicate key") ? "23505" : "");
    if (code === "23505") {
      return NextResponse.json(
        { error: "MOU already exists for this progress" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create MOU", detail: msg || error },
      { status: 500 }
    );
  }

  // 2) Update progress_kplt.status = 'Mou'
  const { error: updErr } = await supabase
    .from("progress_kplt")
    .update({
      status: "Mou",
      updated_at: new Date().toISOString(),
    })
    .eq("id", progressId);

  if (updErr) {
    // Kompensasi: hapus MOU yang baru dibuat agar konsisten
    await supabase.from("mou").delete().eq("id", data.id);
    return NextResponse.json(
      {
        error: "Failed to advance progress to 'Mou'",
        detail: updErr.message ?? updErr,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}

// PATCH /api/progress/[id]/mou
// - id = progress_kplt_id
// - Temukan MOU yg sesuai branch via embed, lalu update by id
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canProgressKplt("update", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );

  const progressId = params?.id;
  if (!progressId)
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });

  const body = await req.json().catch(() => ({}));
  if (
    "id" in body ||
    "progress_kplt_id" in body ||
    "final_status_mou" in body
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid payload: id/progress_kplt_id/final_status_mou are server-controlled",
      },
      { status: 400 }
    );
  }

  const parsed = MouUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", detail: parsed.error.issues },
      { status: 422 }
    );
  }

  // Cari target MOU via embed + filter branch
  const { data: target, error: findErr } = await supabase
    .from("mou")
    .select(
      `
      id,
      final_status_mou,
      progress_kplt:progress_kplt!mou_progress_kplt_id_fkey!inner (
        id,
        kplt:kplt!progress_kplt_kplt_id_fkey!inner ( id, branch_id )
      )
      `
    )
    .eq("progress_kplt_id", progressId)
    .eq("progress_kplt.kplt.branch_id", user.branch_id)
    .maybeSingle();

  if (findErr) {
    return NextResponse.json(
      { error: "Failed to find MOU", detail: findErr.message ?? findErr },
      { status: 500 }
    );
  }
  if (!target) {
    return NextResponse.json(
      { error: "MOU not found for this progress or out of scope" },
      { status: 404 }
    );
  }
  if (target.final_status_mou && target.final_status_mou !== "Belum") {
    return NextResponse.json(
      {
        error: "MOU has been approved and cannot be edited",
        status: target.final_status_mou,
      },
      { status: 409 }
    );
  }

  const payload = {
    ...stripServerControlledFields(parsed.data),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("mou")
    .update(payload)
    .eq("id", target.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update MOU", detail: error.message ?? error },
      { status: 500 }
    );
  }

  return NextResponse.json({ data }, { status: 200 });
}

// DELETE /api/progress/[id]/mou
// - id = progress_kplt_id
// - Temukan MOU sesuai branch via embed, lalu delete by id
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canProgressKplt("delete", user) && !canProgressKplt("update", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );

  const progressId = params?.id;
  if (!progressId)
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });

  const { data: target, error: findErr } = await supabase
    .from("mou")
    .select(
      `
      id,
      final_status_mou,
      progress_kplt:progress_kplt!mou_progress_kplt_id_fkey!inner (
        id,
        kplt:kplt!progress_kplt_kplt_id_fkey!inner ( id, branch_id )
      )
      `
    )
    .eq("progress_kplt_id", progressId)
    .eq("progress_kplt.kplt.branch_id", user.branch_id)
    .maybeSingle();

  if (findErr) {
    return NextResponse.json(
      { error: "Failed to find MOU", detail: findErr.message ?? findErr },
      { status: 500 }
    );
  }
  if (!target) {
    return NextResponse.json(
      { error: "MOU not found for this progress or out of scope" },
      { status: 404 }
    );
  }

  if (target.final_status_mou && target.final_status_mou !== "Belum") {
    return NextResponse.json(
      {
        error: "MOU has been approved and cannot be deleted",
        status: target.final_status_mou,
      },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("mou")
    .delete()
    .eq("id", target.id)
    .select("id");

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete MOU", detail: error.message ?? error },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      data: {
        deleted: (data ?? []).length,
        ids: data?.map((r: { id: number | string }) => r.id),
      },
    },
    { status: 200 }
  );
}
