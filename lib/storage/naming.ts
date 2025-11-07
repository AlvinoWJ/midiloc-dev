// Util penamaan key Storage berbasis nama kolom (field)
const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-excel": ".xls",
  "text/csv": ".csv",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
  "video/x-msvideo": ".avi",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

function extFromFilename(name?: string): string | null {
  if (!name) return null;
  const m = name.match(/\.[a-z0-9]+$/i);
  return m ? m[0].toLowerCase() : null;
}

function extFromMime(mime?: string): string | null {
  if (!mime) return null;
  return MIME_TO_EXT[mime.toLowerCase()] ?? null;
}

// Bangun key: <ulok_id>/<module>/<timestamp>_<field><ext>
export function makeFieldKey(
  ulokId: string,
  moduleName: string,
  field: string,
  file: File
) {
  const ts = Date.now();
  const ext = extFromFilename(file.name) || extFromMime(file.type) || ".bin";
  // field diasumsikan nama kolom (snake_case) sehingga aman dipakai langsung
  return `${ulokId}/${moduleName}/${ts}_${field}${ext}`;
}

// Validasi prefix key saat payload JSON membawa key langsung (tanpa upload)
export function isValidPrefixKey(
  ulokId: string,
  moduleName: string,
  key: string
) {
  return typeof key === "string" && key.startsWith(`${ulokId}/${moduleName}/`);
}

// Helper untuk memformat nama default "ulok dari eksternal", disamakan dengan pola di DB
// Pola: ULOK-EXT-RENAME-{KODE_BRANCH|NO-BRANCH}-{KECAMATAN}-{SHORT_ALAMAT}-{YYYYMMDD}
export function formatExternalUlokName(args: {
  kode_branch?: string | null;
  kecamatan?: string | null;
  alamat?: string | null;
  date?: Date; // default: now
}): string {
  const kodeBranch = (args.kode_branch ?? "NO-BRANCH").toString();
  const kec = (args.kecamatan ?? "").toString();
  const alamat = (args.alamat ?? "").toString();
  const date = args.date ?? new Date();
  const shortAlamat = alamat.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 20);
  const yyyymmdd = [
    date.getFullYear().toString().padStart(4, "0"),
    (date.getMonth() + 1).toString().padStart(2, "0"),
    date.getDate().toString().padStart(2, "0"),
  ].join("");

  const raw =
    `ULOK-EXT-RENAME-${kodeBranch}-${kec}-${shortAlamat}-${yyyymmdd}`.toUpperCase();
  // Ganti non A-Z0-9- menjadi '-'
  return raw.replace(/[^A-Z0-9\-]+/g, "-").slice(0, 255);
}
