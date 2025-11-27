export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function extFromNameOrType(name: string, type?: string, fallback = "") {
  const m = name.toLowerCase().match(/\.[a-z0-9]+$/);
  if (m) return m[0];
  if (!type) return fallback;
  if (type.includes("pdf")) return ".pdf";
  if (type.includes("sheet") || type.includes("excel")) return ".xlsx";
  if (type.includes("csv")) return ".csv";
  if (type.includes("mp4")) return ".mp4";
  if (type.includes("quicktime")) return ".mov";
  if (type.includes("webm")) return ".webm";
  if (type.includes("avi")) return ".avi";
  if (type.includes("png")) return ".png";
  if (type.includes("jpeg") || type.includes("jpg")) return ".jpg";
  if (type.includes("webp")) return ".webp";
  return fallback;
}

/**
 * Path seragam untuk semua dokumen ULOK & KPLT:
 * <ulokId>/<section>/<timestamp>_<field><ext>
 * section: 'ulok' | 'kplt'
 * field: nama kolom (mis. 'form_ulok', 'file_intip', 'pdf_foto', dst.)
 */
export function buildPathByField(
  ulokId: string,
  section: "ulok" | "kplt",
  field: string,
  originalName: string,
  contentType?: string
) {
  const ts = Date.now();
  const ext = extFromNameOrType(originalName, contentType, "");
  const safeField = slugify(field);
  return `${ulokId}/${section}/${ts}_${safeField}${ext}`;
}

export const PDF_FIELDS = [
  "pdf_foto",
  "pdf_pembanding",
  "pdf_kks",
  "pdf_form_ukur",
] as const;
export const EXCEL_FIELDS = [
  "counting_kompetitor",
  "excel_fpl",
  "excel_pe",
] as const;
export const VIDEO_FIELDS = [
  "video_traffic_siang",
  "video_traffic_malam",
  "video_360_siang",
  "video_360_malam",
] as const;
export const IMAGE_FIELDS = ["peta_coverage"] as const;

export const MIME = {
  pdf: ["application/pdf"],
  excel: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
  ],
  video: ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"],
  image: ["image/png", "image/jpeg", "image/webp"],
};

export function isUuid(v: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    v
  );
}

export function isDbError(
  e: unknown
): e is { code?: string; message?: string; hint?: string } {
  return (
    typeof e === "object" &&
    e !== null &&
    ("code" in e || "message" in e || "hint" in e)
  );
}
