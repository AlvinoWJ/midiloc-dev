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
