import useSWR from "swr";

// =========================================================================
// 1. TYPE DEFINITIONS (Definisi Tipe Data)
// =========================================================================

/**
 * Struktur data file mentah dari API.
 */
export type KpltFile = {
  name: string;
  field: string | null; // Nama field database terkait (jika ada)
  size: number; // Ukuran dalam bytes
  last_modified: string; // Tanggal ISO string
  href: string; // URL download/preview
};

/**
 * Struktur Response API untuk endpoint list files.
 */
export type KpltFilesApiResponse = {
  id: string;
  folder: string;
  page: number;
  limit: number;
  count: number;
  files: KpltFile[];
};

/**
 * MappedKpltFile
 * --------------
 * View Model: Data file yang sudah diformat untuk kebutuhan UI.
 * - Size sudah dalam string (KB/MB).
 * - Tanggal sudah dilokalisasi.
 * - Tipe file dikategorikan untuk keperluan ikon.
 */
export type MappedKpltFile = {
  name: string;
  field: string | null;
  href: string;
  sizeFormatted: string; // e.g., "1.4 KB"
  lastModifiedFormatted: string; // e.g., "13/10/2025"
  fileType: "pdf" | "excel" | "video" | "image" | "other";
};

// =========================================================================
// 2. ERROR HANDLING & FETCHER
// =========================================================================

/**
 * Custom Error untuk menangani response non-2xx dari fetch.
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

// =========================================================================
// 3. HELPER FUNCTIONS (Utilitas)
// =========================================================================

/**
 * Mengubah angka bytes menjadi string yang mudah dibaca (Human Readable).
 * Contoh: 1024 -> "1 KB", 1048576 -> "1 MB"
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  // Menghitung indeks array sizes berdasarkan logaritma
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Mengembalikan kategori file berdasarkan ekstensi.
 * Berguna untuk menentukan ikon apa yang ditampilkan di UI.
 */
function getFileType(fileName: string): MappedKpltFile["fileType"] {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (ext === "pdf") return "pdf";
  if (["xlsx", "xls", "csv"].includes(ext)) return "excel";
  if (["mp4", "mov", "webm", "avi"].includes(ext)) return "video";
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return "image";

  return "other";
}

/**
 * Mapper: Mengubah data API menjadi data UI.
 * Melakukan formatting tanggal dan size di sini agar komponen UI tetap bersih (logic-less).
 */
function mapKpltFilesResponse(
  data: KpltFilesApiResponse | undefined
): MappedKpltFile[] | undefined {
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

// =========================================================================
// 4. MAIN HOOK
// =========================================================================

/**
 * useKpltFiles Hook
 * -----------------
 * Hook untuk mengambil daftar file yang terkait dengan KPLT tertentu.
 * Mengakses endpoint `/api/kplt/[id]/files`.
 */
export function useKpltFiles(id: string | undefined) {
  // Conditional Fetching: Key null akan men-disable request SWR
  const key = id ? `/api/kplt/${id}/files` : null;

  const {
    data: rawData,
    error,
    isLoading,
    mutate,
  } = useSWR<KpltFilesApiResponse>(key, fetcher);

  // Transformasi data sebelum dikembalikan ke komponen
  const files = mapKpltFilesResponse(rawData);

  return {
    files, // Data file yang sudah diformat (siap pakai di UI)
    rawData, // Data mentah dari API (jika dibutuhkan)
    isLoading,
    isError: !!error,
    error,
    mutate, // Fungsi untuk refresh data (misal setelah upload file baru)
  };
}
