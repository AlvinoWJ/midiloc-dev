import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assignPICSchema } from "@/lib/validations/ulok_eksternal_workflow";
import { getCurrentUser, POSITION } from "@/lib/auth/acl";
import { formatExternalUlokName } from "@/lib/storage/naming";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toISODateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  try {
    const me = await getCurrentUser();
    if (!me)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isManager =
      me.position_nama === POSITION.LOCATION_MANAGER ||
      me.position_nama === POSITION.BRANCH_MANAGER;

    if (!isManager) {
      return NextResponse.json(
        {
          error:
            "Forbidden: hanya Location Manager / Branch Manager yang dapat menetapkan penanggungjawab",
        },
        { status: 403 }
      );
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Body harus JSON" }, { status: 400 });
    }

    const parsed = assignPICSchema.safeParse(json);
    if (!parsed.success) {
      const msg = parsed.error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      return NextResponse.json({ error: msg }, { status: 422 });
    }
    const { penanggungjawab, description } = parsed.data;

    // Ambil ulok_eksternal untuk validasi branch dan data yang dibutuhkan assignment
    const { data: ulokEks, error: findErr } = await supabase
      .from("ulok_eksternal")
      .select(
        "id, branch_id, penanggungjawab, created_at, latitude, longitude, kecamatan, alamat"
      )
      .eq("id", params.id)
      .maybeSingle();

    if (findErr)
      return NextResponse.json({ error: findErr.message }, { status: 400 });
    if (!ulokEks)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!ulokEks.branch_id) {
      return NextResponse.json(
        { error: "Silakan pilih branch terlebih dahulu" },
        { status: 409 }
      );
    }

    // Manager harus berada pada branch yang sama
    if (me.branch_id !== ulokEks.branch_id) {
      return NextResponse.json(
        { error: "Forbidden: Anda tidak berada pada branch ulok ini" },
        { status: 403 }
      );
    }

    // Validasi kandidat penanggungjawab adalah Location Specialist di branch tersebut
    const { data: candidate, error: candErr } = await supabase
      .from("users")
      .select("id, branch_id, position_id, email")
      .eq("id", penanggungjawab)
      .maybeSingle();

    if (candErr)
      return NextResponse.json({ error: candErr.message }, { status: 400 });
    if (!candidate)
      return NextResponse.json(
        { error: "User penanggungjawab tidak ditemukan" },
        { status: 404 }
      );

    if (candidate.branch_id !== ulokEks.branch_id) {
      return NextResponse.json(
        { error: "Penanggungjawab harus berada pada branch yang sama" },
        { status: 409 }
      );
    }

    // Cek position kandidat = Location Specialist
    let isLS = false;
    if (candidate.position_id) {
      const { data: pos, error: posErr } = await supabase
        .from("position")
        .select("nama")
        .eq("id", candidate.position_id)
        .maybeSingle();
      if (posErr)
        return NextResponse.json({ error: posErr.message }, { status: 400 });
      isLS =
        pos?.nama?.toLowerCase() === POSITION.LOCATION_SPECIALIST.toLowerCase();
    }
    if (!isLS) {
      return NextResponse.json(
        { error: "Penanggungjawab harus berposisi Location Specialist" },
        { status: 409 }
      );
    }

    // Jika penanggungjawab sama dengan sebelumnya, jangan buat assignment duplikat
    if (
      ulokEks.penanggungjawab &&
      ulokEks.penanggungjawab === penanggungjawab
    ) {
      return NextResponse.json({
        data: { ...ulokEks },
        info: "Penanggungjawab tidak berubah, assignment baru tidak dibuat",
      });
    }

    // Update penanggungjawab
    const { data: updated, error: updateErr } = await supabase
      .from("ulok_eksternal")
      .update({ penanggungjawab, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select("*")
      .single();

    const ulokEKsId = updated.id;

    if (updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 400 });

    // Siapkan data untuk Assignment
    // Ambil kode_branch untuk formatting nama lokasi activity
    const { data: branch, error: bErr } = await supabase
      .from("branch")
      .select("id, kode_branch")
      .eq("id", ulokEks.branch_id)
      .maybeSingle();
    if (bErr)
      return NextResponse.json({ error: bErr.message }, { status: 400 });

    const now = new Date();
    const startDate = toISODateOnly(now);
    const endDate = toISODateOnly(
      new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    );

    // Title menggunakan tanggal created_at ulok_eksternal agar konsisten dengan permintaan
    const createdAt = ulokEks.created_at ? new Date(ulokEks.created_at) : now;
    const titleDate = toISODateOnly(createdAt);
    const title = `Cek Usulan Lokasi Eksternal ${titleDate}`;

    // Buat Assignment
    type AssignmentInsert = {
      user_id: string;
      assigned_by: string;
      title: string;
      description?: string | null;
      assignment_type: string;
      status?: string;
      start_date: string;
      end_date: string;
      check_in_radius: number;
      completed_at?: string | null;
      notes?: string | null;
      // location_name / latitude / longitude: biarkan null sesuai instruksi
    };

    const assignmentPayload: AssignmentInsert = {
      user_id: penanggungjawab,
      assigned_by: me.id,
      title,
      description: description ?? null,
      assignment_type: "external_check",
      // status: undefined, // biarkan default
      start_date: startDate,
      end_date: endDate,
      check_in_radius: 100,
      completed_at: null,
      notes: null,
    };

    const { data: assignment, error: assErr } = await supabase
      .from("assignments")
      .insert(assignmentPayload)
      .select("id")
      .single();

    if (assErr) {
      // Rollback penanggungjawab jika gagal membuat assignment
      await supabase
        .from("ulok_eksternal")
        .update({
          penanggungjawab: ulokEks.penanggungjawab ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id);
      return NextResponse.json(
        { error: `Gagal membuat assignment: ${assErr.message}` },
        { status: 400 }
      );
    }

    // Pilih Activity Template:
    // 1) coba template bernama "Cek Usulan Lokasi Eksternal" yang aktif
    // 2) jika tidak ada, ambil template aktif pertama
    // 3) jika tidak ada sama sekali → 409 butuh setup
    let activityTemplateId: string | null = null;
    {
      const { data: t1, error: t1Err } = await supabase
        .from("activity_templates")
        .select("id")
        .eq("is_active", true)
        .eq("name", "Cek Usulan Lokasi")
        .maybeSingle();

      if (!t1Err && t1) {
        activityTemplateId = t1.id;
      } else {
        const { data: t2, error: t2Err } = await supabase
          .from("activity_templates")
          .select("id")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();
        if (!t2Err && t2) activityTemplateId = t2.id;
      }
    }

    if (!activityTemplateId) {
      // Cleanup assignment + revert penanggungjawab
      await supabase.from("assignments").delete().eq("id", assignment.id);
      await supabase
        .from("ulok_eksternal")
        .update({
          penanggungjawab: ulokEks.penanggungjawab ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id);
      return NextResponse.json(
        {
          error:
            "Tidak ada activity template aktif. Buat template aktif terlebih dahulu (disarankan bernama 'Cek Usulan Lokasi Eksternal').",
        },
        { status: 409 }
      );
    }

    // Siapkan location_name untuk assignment activity (pola sama seperti ulok internal)
    const locationName = formatExternalUlokName({
      kode_branch: branch?.kode_branch ?? null,
      kecamatan: ulokEks.kecamatan ?? null,
      alamat: ulokEks.alamat ?? null,
      date: now,
    });

    // Buat Assignment Activity
    const { data: activity, error: actErr } = await supabase
      .from("assignment_activities")
      .insert({
        assignment_id: assignment.id,
        activity_template_id: activityTemplateId,
        is_completed: false,
        notes: null,
        location_name: locationName,
        latitude: ulokEks.latitude ?? null,
        longitude: ulokEks.longitude ?? null,
        check_in_radius: 100,
        requires_checkin: true,
        external_location_id: ulokEKsId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select("id")
      .single();

    if (actErr) {
      // Cleanup assignment + revert penanggungjawab jika activity gagal
      await supabase.from("assignments").delete().eq("id", assignment.id);
      await supabase
        .from("ulok_eksternal")
        .update({
          penanggungjawab: ulokEks.penanggungjawab ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id);
      return NextResponse.json(
        { error: `Gagal membuat assignment activity: ${actErr.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: updated,
      assignment: { id: assignment.id, title },
      activity: { id: activity.id, location_name: locationName },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
