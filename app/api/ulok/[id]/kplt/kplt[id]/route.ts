// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { NextResponse } from "next/server";
// import { createClient } from "@/lib/supabase/client";
// import { getCurrentUser, canUlok } from "@/lib/auth/acl";
// import { KpltCreateWithUlokIdSchema } from "@/lib/validations/kplt";

// type AnyObj = Record<string, any>;

// const LM_FIELDS = [
//   "kplt_approval",
//   "kplt_approved_at",
//   "kplt_approved_by",
// ] as const;
// const LM_FIELDS_SET = new Set<string>(LM_FIELDS as unknown as string[]);
// const FORBIDDEN_LS_FIELDS = [
//   "id",
//   "ulok_id",
//   "branch_id",
//   "created_at",
//   "updated_at",
//   "updated_by",
//   "is_active",
//   ...LM_FIELDS,
// ] as const;

// function pick<T extends AnyObj, K extends keyof T>(
//   obj: T,
//   keys: readonly K[]
// ): Pick<T, K> {
//   const out = {} as Pick<T, K>;
//   for (const k of keys) {
//     if (Object.prototype.hasOwnProperty.call(obj, k)) {
//       out[k] = obj[k];
//     }
//   }
//   return out;
// }

// function omit<T extends AnyObj, K extends keyof T>(
//   obj: T,
//   keys: readonly K[]
// ): Omit<T, K> {
//   const out = { ...obj } as T;
//   for (const k of keys) {
//     if (Object.prototype.hasOwnProperty.call(out, k)) {
//       delete (out as any)[k];
//     }
//   }
//   return out as Omit<T, K>;
// }

// // GET /api/kplt/:id
// // Catatan: fokus ke tabel kplt saja (tanpa join ke ulok).
// export async function GET(
//   _req: Request,
//   { params }: { params: { id: string } }
// ) {
//   const supabase = await createClient();
//   const user = await getCurrentUser();

//   if (!user)
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   if (!canUlok("read", user)) {
//     return NextResponse.json(
//       { error: "Forbidden", message: "Access denied" },
//       { status: 403 }
//     );
//   }
//   if (!user.branch_id) {
//     return NextResponse.json(
//       { error: "Forbidden", message: "User has no branch" },
//       { status: 403 }
//     );
//   }

//   const { id } = params;

//   // Scope by branch saja untuk kedua role (tanpa join ulok)
//   const { data, error } = await supabase
//     .from("kplt")
//     .select("*")
//     .eq("id", id)
//     .eq("branch_id", user.branch_id)
//     .maybeSingle();

//   if (error) {
//     return NextResponse.json(
//       { error: "Failed to fetch KPLT", detail: error.message ?? error },
//       { status: 500 }
//     );
//   }
//   if (!data) return NextResponse.json({ error: "Not Found" }, { status: 404 });

//   return NextResponse.json({ data }, { status: 200 });
// }

// // PATCH /api/kplt/:id
// // PUT /api/kplt/:id (diperlakukan sama dengan PATCH)
// export async function PATCH(req: Request, ctx: { params: { id: string } }) {
//   return handleUpdate(req, ctx);
// }
// export async function PUT(req: Request, ctx: { params: { id: string } }) {
//   return handleUpdate(req, ctx);
// }

// async function handleUpdate(
//   req: Request,
//   { params }: { params: { id: string } }
// ) {
//   const supabase = await createClient();
//   const user = await getCurrentUser();

//   if (!user)
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   if (!canUlok("update", user)) {
//     return NextResponse.json(
//       { error: "Forbidden", message: "Access denied" },
//       { status: 403 }
//     );
//   }
//   if (!user.branch_id) {
//     return NextResponse.json(
//       { error: "Forbidden", message: "User has no branch" },
//       { status: 403 }
//     );
//   }

//   const { id } = params;
//   const body = (await req.json().catch(() => null)) as AnyObj | null;
//   if (!body || typeof body !== "object") {
//     return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
//   }

//   // Pastikan record ada dan di branch yang sama
//   const { data: existing, error: existErr } = await supabase
//     .from("kplt")
//     .select("id, branch_id")
//     .eq("id", id)
//     .eq("branch_id", user.branch_id)
//     .maybeSingle();

//   if (existErr) {
//     return NextResponse.json(
//       { error: "Lookup failed", detail: existErr.message ?? existErr },
//       { status: 500 }
//     );
//   }
//   if (!existing) {
//     return NextResponse.json({ error: "Not Found" }, { status: 404 });
//   }

//   const now = new Date().toISOString();

//   // Role: Location Manager → hanya boleh approval fields
//   if (String(user.position_nama).toLowerCase() === "location manager") {
//     const keys = Object.keys(body);
//     const invalid = keys.filter((k) => !LM_FIELDS_SET.has(k));
//     if (invalid.length > 0) {
//       return NextResponse.json(
//         {
//           error: "LM is only allowed to modify approval fields",
//           disallowed_fields: invalid,
//           allowed_fields: Array.from(LM_FIELDS_SET),
//         },
//         { status: 400 }
//       );
//     }
//     if (keys.length === 0) {
//       return NextResponse.json(
//         {
//           error: "No approval fields provided",
//           allowed_fields: Array.from(LM_FIELDS_SET),
//         },
//         { status: 400 }
//       );
//     }

//     const allowedPayload = pick(
//       body,
//       LM_FIELDS as unknown as readonly (keyof typeof body)[]
//     );
//     // Jika menyentuh approval, auto-set approved_by/approved_at jika belum ada
//     const touchingApproval =
//       "kplt_approval" in allowedPayload ||
//       "kplt_approved_at" in allowedPayload ||
//       "kplt_approved_by" in allowedPayload;
//     if (touchingApproval) {
//       if (!(allowedPayload as any)["kplt_approved_by"])
//         (allowedPayload as any)["kplt_approved_by"] = user.id;
//       if (!(allowedPayload as any)["kplt_approved_at"])
//         (allowedPayload as any)["kplt_approved_at"] = now;
//     }

//     const { data: updated, error: updateErr } = await supabase
//       .from("kplt")
//       .update({
//         ...allowedPayload,
//         updated_by: user.id,
//         updated_at: now,
//       })
//       .eq("id", id)
//       .eq("branch_id", user.branch_id)
//       .select("*")
//       .single();

//     if (updateErr) {
//       return NextResponse.json(
//         { error: "Update failed", detail: updateErr.message ?? updateErr },
//         { status: 500 }
//       );
//     }
//     return NextResponse.json({ data: updated }, { status: 200 });
//   }

//   // Role: Location Specialist → tidak boleh sentuh FK/ownership/approval fields
//   if (String(user.position_nama).toLowerCase() === "location specialist") {
//     // Cegah field terlarang
//     const forbiddenTouches = new Set<string>([...FORBIDDEN_LS_FIELDS]);
//     const disallowed = Object.keys(body).filter((k) => forbiddenTouches.has(k));
//     if (disallowed.length > 0) {
//       return NextResponse.json(
//         {
//           error: "You are not allowed to modify these fields",
//           disallowed_fields: disallowed,
//         },
//         { status: 400 }
//       );
//     }

//     const allowedPayload = omit(
//       body,
//       FORBIDDEN_LS_FIELDS as unknown as readonly (keyof typeof body)[]
//     );
//     if (Object.keys(allowedPayload).length === 0) {
//       return NextResponse.json(
//         { error: "No permitted fields to update for your role" },
//         { status: 400 }
//       );
//     }

//     // Validasi shape supaya tidak ada key liar (schema strict)
//     const parsed = KpltFieldsSchema.safeParse(allowedPayload);
//     if (!parsed.success) {
//       return NextResponse.json(
//         { message: "Validasi gagal", error: parsed.error.issues },
//         { status: 422 }
//       );
//     }

//     const { data: updated, error: updateErr } = await supabase
//       .from("kplt")
//       .update({
//         ...parsed.data,
//         updated_by: user.id,
//         updated_at: now,
//       })
//       .eq("id", id)
//       .eq("branch_id", user.branch_id)
//       .select("*")
//       .single();

//     if (updateErr) {
//       return NextResponse.json(
//         { error: "Update failed", detail: updateErr.message ?? updateErr },
//         { status: 500 }
//       );
//     }
//     return NextResponse.json({ data: updated }, { status: 200 });
//   }

//   // Role lain
//   return NextResponse.json(
//     { error: "Forbidden for your role" },
//     { status: 403 }
//   );
// }

// // DELETE /api/kplt/:id
// // Fokus ke tabel kplt saja; contoh ini membolehkan LS menghapus di branch-nya, LM tetap forbidden (ikuti kebijakan sebelumnya).
// export async function DELETE(
//   _req: Request,
//   { params }: { params: { id: string } }
// ) {
//   const supabase = await createClient();
//   const user = await getCurrentUser();

//   if (!user)
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   if (!canUlok("delete", user)) {
//     return NextResponse.json(
//       { error: "Forbidden", message: "Access denied" },
//       { status: 403 }
//     );
//   }
//   if (!user.branch_id) {
//     return NextResponse.json(
//       { error: "Forbidden", message: "User has no branch" },
//       { status: 403 }
//     );
//   }

//   const role = String(user.position_nama).toLowerCase();
//   const { id } = params;

//   if (role === "location specialist") {
//     const { data, error } = await supabase
//       .from("kplt")
//       .delete()
//       .eq("id", id)
//       .eq("branch_id", user.branch_id)
//       .select("id")
//       .maybeSingle();

//     if (error) {
//       return NextResponse.json(
//         { error: "Delete failed", detail: error.message ?? error },
//         { status: 500 }
//       );
//     }
//     if (!data) {
//       return NextResponse.json({ error: "Not Found" }, { status: 404 });
//     }
//     return NextResponse.json(
//       { success: true, deleted_id: data.id },
//       { status: 200 }
//     );
//   }

//   // Kebijakan: LM tidak diperkenankan menghapus
//   return NextResponse.json(
//     { error: "Forbidden for your role" },
//     { status: 403 }
//   );
// }
