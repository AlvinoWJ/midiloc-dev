// lib/file-validators.ts
export type FileCheckResult = {
  ok: boolean;
  reason?: string;
};

/**
 * Membaca n-byte pertama dari file untuk pengecekan signature
 */
async function getFileHeader(file: File, length: number): Promise<Uint8Array> {
  const buffer = await file.slice(0, length).arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Helper untuk mengubah Uint8Array ke Hex String
 */
function toHexString(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ")
    .toUpperCase();
}

// ==========================================
// 1. VALIDATOR PDF (Yang sudah ada)
// ==========================================
export async function isPdfFile(file: File): Promise<FileCheckResult> {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return { ok: false, reason: "Ekstensi bukan .pdf" };
  }

  const header = await getFileHeader(file, 5);
  const signature = new TextDecoder().decode(header);

  // Header PDF harus "%PDF-"
  if (!signature.startsWith("%PDF-")) {
    return { ok: false, reason: "Header file tidak valid (Bukan PDF asli)" };
  }

  return { ok: true };
}

// ==========================================
// 2. VALIDATOR EXCEL (.xlsx, .xls)
// ==========================================
export async function isExcelFile(file: File): Promise<FileCheckResult> {
  const name = file.name.toLowerCase();
  const isXlsx = name.endsWith(".xlsx");
  const isXls = name.endsWith(".xls");

  if (!isXlsx && !isXls) {
    return { ok: false, reason: "Ekstensi harus .xlsx atau .xls" };
  }

  const header = await getFileHeader(file, 8);
  const hex = toHexString(header);

  if (isXlsx) {
    // .xlsx adalah file ZIP. Signature: 50 4B 03 04
    if (!hex.startsWith("50 4B 03 04")) {
      return {
        ok: false,
        reason: "File .xlsx rusak atau palsu (Invalid ZIP header)",
      };
    }
  } else if (isXls) {
    // .xls (OLE2 format). Signature: D0 CF 11 E0 A1 B1 1A E1
    if (!hex.startsWith("D0 CF 11 E0 A1 B1 1A E1")) {
      return {
        ok: false,
        reason: "File .xls rusak atau palsu (Invalid OLE header)",
      };
    }
  }

  return { ok: true };
}

// ==========================================
// 3. VALIDATOR IMAGE (.png, .jpg, .jpeg, .webp)
// ==========================================
export async function isImageFile(file: File): Promise<FileCheckResult> {
  const validExts = [".png", ".jpg", ".jpeg", ".webp"];
  const name = file.name.toLowerCase();

  if (!validExts.some((ext) => name.endsWith(ext))) {
    return { ok: false, reason: `Ekstensi gambar tidak didukung (${name})` };
  }

  const header = await getFileHeader(file, 12);
  const hex = toHexString(header);

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (name.endsWith(".png")) {
    if (!hex.startsWith("89 50 4E 47 0D 0A 1A 0A")) {
      return { ok: false, reason: "Bukan file PNG valid" };
    }
  }

  // JPEG/JPG: FF D8 FF
  else if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    if (!hex.startsWith("FF D8 FF")) {
      return { ok: false, reason: "Bukan file JPEG valid" };
    }
  }

  // WEBP: RIFF .... WEBP
  // Byte 0-3: "RIFF" (52 49 46 46)
  // Byte 8-11: "WEBP" (57 45 42 50)
  else if (name.endsWith(".webp")) {
    const riff = hex.substring(0, 11); // "52 49 46 46"
    const webp = toHexString(header.slice(8, 12)); // "57 45 42 50"

    if (riff !== "52 49 46 46" || webp !== "57 45 42 50") {
      return { ok: false, reason: "Bukan file WebP valid" };
    }
  }

  return { ok: true };
}

// ==========================================
// 4. VALIDATOR VIDEO (.mp4, .mov, .avi, .webm)
// ==========================================
export async function isVideoFile(file: File): Promise<FileCheckResult> {
  const validExts = [".mp4", ".mov", ".avi", ".webm"];
  const name = file.name.toLowerCase();

  if (!validExts.some((ext) => name.endsWith(ext))) {
    return { ok: false, reason: `Format video tidak didukung (${name})` };
  }

  const header = await getFileHeader(file, 12);
  const hex = toHexString(header);

  // MP4 & MOV biasanya dimulai dengan "ftyp" atom di offset ke-4
  // Pattern: XX XX XX XX 66 74 79 70 (ftyp)
  if (name.endsWith(".mp4") || name.endsWith(".mov")) {
    // Cek byte ke 4-7 apakah "ftyp" (66 74 79 70)
    const ftyp = toHexString(header.slice(4, 8));
    // Ada juga signature "moov" untuk beberapa file lama, tapi ftyp paling umum
    const moov = toHexString(header.slice(4, 8));

    // QuickTime (MOV) wide atom: 00 00 00 14 66 74 79 70 ...
    if (ftyp !== "66 74 79 70" && moov !== "6D 6F 6F 76") {
      // Cek fallback signature MP4/QuickTime umum
      // Kadang file MP4 tidak punya ftyp di awal jika streaming, tapi jarang untuk upload user.
      // Kita perketat dulu:
      return {
        ok: false,
        reason: "Header video MP4/MOV tidak valid (No ftyp/moov atom)",
      };
    }
  }

  // AVI: RIFF .... AVI
  // Byte 0-3: RIFF (52 49 46 46)
  // Byte 8-11: AVI (41 56 49 20)
  else if (name.endsWith(".avi")) {
    const riff = hex.substring(0, 11);
    const avi = toHexString(header.slice(8, 12));
    if (riff !== "52 49 46 46" || avi !== "41 56 49 20") {
      return { ok: false, reason: "Bukan file AVI valid" };
    }
  }

  // WEBM: 1A 45 DF A3 (EBML Header)
  else if (name.endsWith(".webm")) {
    if (!hex.startsWith("1A 45 DF A3")) {
      return { ok: false, reason: "Bukan file WebM valid" };
    }
  }

  return { ok: true };
}
