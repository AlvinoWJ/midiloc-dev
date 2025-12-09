// hooks/useModuleFiles.tsx

import useSWR from "swr";

/**
 * ALLOWED_MODULES
 * ----------------
 * Daftar modul yang diizinkan.
 * Value ini digunakan untuk menentukan folder/module apa yang dapat diakses
 * melalui API `/api/files/[module]/[id]`.
 */
export const ALLOWED_MODULES = [
  "kplt",
  "ulok",
  "mou",
  "perizinan",
  "notaris",
  "renovasi",
  "izin_tetangga",
  "grand_opening",
] as const;

/**
 * AllowedModule
 * ----------------
 * Tipe union otomatis berdasarkan isi array ALLOWED_MODULES.
 * Memastikan hanya module valid yang bisa digunakan.
 */
export type AllowedModule = (typeof ALLOWED_MODULES)[number];

/**
 * ModuleFile
 * ----------------
 * Struktur file mentah yang di-return oleh API.
 */
export type ModuleFile = {
  name: string;
  field: string | null;
  size: number;
  last_modified: string;
  href: string; // URL signed link / direct link
};

/**
 * ModuleFilesApiResponse
 * ----------------------
 * Struktur lengkap response dari API.
 * Berisi metadata pagination, module, dan list files.
 */
export type ModuleFilesApiResponse = {
  id: string;
  folder: string;
  page: number;
  limit: number;
  count: number;
  files: ModuleFile[];
  modulesFile?: AllowedModule;
  ulok_id?: string;
};

/**
 * MappedModuleFile
 * ----------------
 * Data file setelah diproses (formatted & enriched).
 * Digunakan untuk kebutuhan UI agar lebih mudah dibaca.
 */
export type MappedModuleFile = {
  name: string;
  field: string | null;
  href: string;
  sizeFormatted: string; // ex: "1.3 MB"
  lastModifiedFormatted: string; // ex: "21/02/2025"
  fileType: "pdf" | "excel" | "video" | "image" | "other";
};

/**
 * FetchError
 * ----------------
 * Custom error untuk menangkap error dari fetcher.
 * Menyimpan:
 * - info → payload error dari server
 * - status → status code HTTP
 */
class FetchError extends Error {
  info: any;
  status: number;

  constructor(message: string, info: any, status: number) {
    super(message);
    this.name = "FetchError";
    this.info = info;
    this.status = status;
  }
}

/**
 * fetcher()
 * ----------------
 * Fetch util untuk SWR.
 * - Melempar custom error ketika response tidak OK
 * - Mengembalikan JSON ketika sukses
 */
const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const errorInfo = await res.json();
    throw new FetchError(
      "An error occurred while fetching the data.",
      errorInfo,
      res.status
    );
  }

  return res.json();
};

/**
 * formatBytes()
 * ----------------
 * Konversi byte → format readable (KB/MB/GB).
 * Contoh: 1536000 → "1.46 MB"
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * getFileType()
 * ----------------
 * Menentukan tipe file berdasarkan ekstensi.
 * Hasilnya digunakan UI untuk menampilkan icon/file badge.
 */
function getFileType(fileName: string): MappedModuleFile["fileType"] {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (ext === "pdf") return "pdf";
  if (["xlsx", "xls", "csv"].includes(ext)) return "excel";
  if (["mp4", "mov", "webm", "avi"].includes(ext)) return "video";
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return "image";

  return "other";
}

/**
 * mapModuleFilesResponse()
 * ------------------------
 * Memformat data dari API menjadi bentuk final yang siap dipakai UI.
 * - Format size
 * - Format tanggal
 * - Tambahkan tipe file
 */
function mapModuleFilesResponse(
  data: ModuleFilesApiResponse | undefined
): MappedModuleFile[] | undefined {
  if (!data || !data.files) return undefined;

  return data.files.map((file) => ({
    name: file.name,
    field: file.field,
    href: file.href,
    sizeFormatted: formatBytes(file.size),
    lastModifiedFormatted: new Date(file.last_modified).toLocaleDateString(
      "id-ID",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    ),
    fileType: getFileType(file.name),
  }));
}

/**
 * useModuleFiles()
 * -----------------
 * Custom Hook utama untuk:
 *
 * 1. Fetch file list berdasarkan module dan id:
 *    - API endpoint: /api/files/[module]/[id]
 *
 * 2. Menghasilkan data hasil mapping:
 *    - File type
 *    - Human-readable size
 *    - Formatted date
 *
 * 3. State yang disediakan:
 *    - files → hasil mapping
 *    - rawData → data mentah dari API
 *    - isLoading → loading state SWR
 *    - isError → boolean error
 *    - error → detail error
 *    - mutate → revalidate data
 */
export function useModuleFiles(
  module: AllowedModule | undefined,
  id: string | undefined
) {
  // SWR key hanya aktif jika module & id tersedia
  const key = module && id ? `/api/files/${module}/${id}` : null;

  const {
    data: rawData,
    error,
    isLoading,
    mutate,
  } = useSWR<ModuleFilesApiResponse>(key, fetcher);

  // Data hasil mapping → siap untuk UI
  const files = mapModuleFilesResponse(rawData);

  return {
    files,
    rawData,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
