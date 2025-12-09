// hooks/useKpltDetail.ts

import useSWR from "swr";
import { KpltBaseUIMapped, KpltBaseData } from "@/types/common";

// =========================================================================
// 1. TYPE DEFINITIONS (Definisi Tipe Data)
// =========================================================================

/**
 * Struktur data untuk riwayat approval individual.
 */
export type ApprovalDetail = {
  id: string;
  kplt_id: string;
  created_at: string;
  approved_at: string;
  approved_by: string;
  is_approved: boolean;
  position_nama: string;
};

/**
 * Struktur data untuk ringkasan approval berdasarkan peran (BM, GM, RM).
 */
export type ApprovalSummaryDetail = {
  approved_at: string;
  approved_by: string;
  is_approved: boolean;
};

/**
 * KpltDetailData
 * --------------
 * Representasi RAW data KPLT yang diterima langsung dari API Backend.
 * Menggunakan format snake_case sesuai database.
 */
export type KpltDetailData = KpltBaseData & {
  id: string;
  ulok_id: string;

  // --- Data Analitis & Skor ---
  apc: number;
  spd: number;
  std: number;
  skor_fpl: number;
  pe_status: string;
  pe_rab: number;
  sosial_ekonomi: string;
  karakter_lokasi: string;

  // --- Nama File (Path mentah dari DB) ---
  pdf_kks: string | null;
  excel_pe: string | null;
  pdf_foto: string | null;
  excel_fpl: string | null;
  peta_coverage: string | null;
  pdf_pembanding: string | null;
  counting_kompetitor: string | null;
  video_360_malam: string | null;
  video_360_siang: string | null;
  video_traffic_malam: string | null;
  video_traffic_siang: string | null;

  // --- Data INTIP & Form Ukur ---
  approval_intip: string | null;
  tanggal_approval_intip: string | null;
  file_intip: string | null;
  tanggal_ukur: string | null;
  form_ukur: string | null;

  // --- Metadata ---
  updated_at: string | null;
  updated_by: string | null;
};

/**
 * Struktur Response JSON lengkap dari API Detail KPLT.
 */
export type KpltDetailApiResponse = {
  kplt: KpltDetailData;
  approvals: ApprovalDetail[];
  approvals_summary: {
    bm: ApprovalSummaryDetail | null;
    gm: ApprovalSummaryDetail | null;
    rm: ApprovalSummaryDetail | null;
  };
};

export type ApprovalsSummary = KpltDetailApiResponse["approvals_summary"];

/**
 * MappedKpltDetail
 * ----------------
 * View Model: Struktur data yang sudah diproses untuk UI.
 * Mengelompokkan field agar komponen UI lebih bersih membacanya.
 */
export type MappedKpltDetail = {
  base: KpltBaseUIMapped & {
    approvalIntipStatus: string | null;
    tanggalApprovalIntip: string | null;
    fileIntipUrl: string | null;
    tanggalUkur: string | null;
    formUkurUrl: string | null;
    kpltapproval?: string;
    created_at?: string;
  };
  analytics: {
    apc: number;
    spd: number;
    std: number;
    scoreFpl: number;
    peStatus: string;
    peRab: number;
    sosialEkonomi: string;
    karakterLokasi: string;
  };
  files: {
    [key: string]: string | null;
  };
  approvals: ApprovalDetail[];
  approvalsSummary: ApprovalsSummary;
};

// =========================================================================
// 2. ERROR HANDLING & FETCHER
// =========================================================================

/**
 * Custom Error Class untuk menangani response non-200 dari API.
 * Menyimpan info error tambahan dari body response JSON.
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
 * Wrapper fetch standar untuk SWR.
 * Melempar FetchError jika status code >= 400.
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

// =========================================================================
// 3. MAPPING LOGIC (Backend Data -> UI Data)
// =========================================================================

/**
 * Fungsi transformasi data.
 * Mengubah data mentah API menjadi struktur yang siap dipakai komponen React.
 * Menangani formatting tanggal, URL file, dan logika bisnis tambahan.
 */
function mapKpltDetailResponse(
  data: KpltDetailApiResponse | undefined
): MappedKpltDetail | undefined {
  if (!data || !data.kplt) return undefined;

  const { kplt, approvals, approvals_summary } = data;
  const kpltId = kplt.id;

  // Clone array approval agar tidak memutasi data asli
  const allApprovals = [...approvals];

  // --- Logic Tambahan: GM Approval ---
  // Jika status KPLT sudah OK/NOK, kita asumsikan GM sudah melakukan approval
  // dan kita buatkan object approval buatan untuk ditampilkan di UI timeline.
  if (kplt.kplt_approval === "OK" || kplt.kplt_approval === "NOK") {
    const isGmApproved = kplt.kplt_approval === "OK";

    const gmApproval: ApprovalDetail = {
      id: `gm-approval-${kplt.id}`,
      kplt_id: kplt.id,
      created_at: kplt.updated_at || new Date().toISOString(),
      approved_at: kplt.updated_at || new Date().toISOString(),
      approved_by: kplt.updated_by || "General Manager",
      is_approved: isGmApproved,
      position_nama: "General Manager",
    };
    allApprovals.push(gmApproval);
  }

  // --- Helper: Format Tanggal (DD/MM/YYYY) ---
  const formatDisplayDate = (isoDate: string | null) => {
    if (!isoDate) return null;
    try {
      return new Date(isoDate).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };

  // --- Helper: Format Tanggal Panjang (DD MMMM YYYY) ---
  const formatTanggal = (tanggalISO: string | null): string => {
    if (!tanggalISO) return "-";
    return new Date(tanggalISO).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // --- Helper: Generate URL File ---
  // Mengubah path file mentah menjadi URL API endpoint yang bisa diakses/download.
  // Menghapus prefix "file_storage/" jika ada.
  const createFileDisplayUrl = (filePath: string | null): string | null => {
    if (!filePath) return null;
    const cleanPath = filePath.replace(/^file_storage\//, "");
    return `/api/kplt/${kpltId}/files?path=${encodeURIComponent(cleanPath)}`;
  };

  // --- Return Mapped Object ---
  return {
    base: {
      namaKplt: kplt.nama_kplt,
      alamat: kplt.alamat,
      luas: kplt.luas,
      panjang: kplt.panjang,
      lebarDepan: kplt.lebar_depan,
      provinsi: kplt.provinsi,
      kabupaten: kplt.kabupaten,
      kecamatan: kplt.kecamatan,
      desaKelurahan: kplt.desa_kelurahan,
      latitude: kplt.latitude,
      longitude: kplt.longitude,
      formatStore: kplt.format_store,
      hargaSewa: kplt.harga_sewa,
      namaPemilik: kplt.nama_pemilik,
      kontakPemilik: kplt.kontak_pemilik,
      alasHak: kplt.alas_hak,
      bentukObjek: kplt.bentuk_objek,
      jumlahLantai: kplt.jumlah_lantai,
      isActive: kplt.is_active,
      formUlok: kplt.form_ulok ? `/api/ulok/${kplt.ulok_id}/form-ulok` : null,
      approvalIntipStatus: kplt.approval_intip ?? null,
      tanggalApprovalIntip: formatDisplayDate(kplt.tanggal_approval_intip),
      fileIntipUrl: createFileDisplayUrl(kplt.file_intip),
      tanggalUkur: formatDisplayDate(kplt.tanggal_ukur),
      formUkurUrl: createFileDisplayUrl(kplt.form_ukur),
      kpltapproval: kplt.kplt_approval || "",
      created_at: formatTanggal(kplt.created_at),
    },
    analytics: {
      apc: kplt.apc,
      spd: kplt.spd,
      std: kplt.std,
      scoreFpl: kplt.skor_fpl,
      peStatus: kplt.pe_status,
      peRab: kplt.pe_rab,
      sosialEkonomi: kplt.sosial_ekonomi,
      karakterLokasi: kplt.karakter_lokasi,
    },
    files: {
      pdfKks: createFileDisplayUrl(kplt.pdf_kks),
      excelPe: createFileDisplayUrl(kplt.excel_pe),
      pdfFoto: createFileDisplayUrl(kplt.pdf_foto),
      excelFpl: createFileDisplayUrl(kplt.excel_fpl),
      petaCoverage: createFileDisplayUrl(kplt.peta_coverage),
      pdfPembanding: createFileDisplayUrl(kplt.pdf_pembanding),
      countingKompetitor: createFileDisplayUrl(kplt.counting_kompetitor),
      video360Malam: createFileDisplayUrl(kplt.video_360_malam),
      video360Siang: createFileDisplayUrl(kplt.video_360_siang),
      videoTrafficMalam: createFileDisplayUrl(kplt.video_traffic_malam),
      videoTrafficSiang: createFileDisplayUrl(kplt.video_traffic_siang),
    },
    approvals: allApprovals,
    approvalsSummary: approvals_summary,
  };
}

// =========================================================================
// 4. MAIN HOOK
// =========================================================================

/**
 * useKpltDetail Hook
 * ------------------
 * Hook utama untuk mengambil data detail KPLT.
 * @param id - ID KPLT yang akan diambil.
 */
export function useKpltDetail(id: string | undefined) {
  // Conditional Fetching: Jika ID tidak ada, key menjadi null (SWR pause)
  const key = id ? `/api/kplt/${id}` : null;

  const {
    data: rawData,
    error,
    isLoading,
    mutate,
  } = useSWR<KpltDetailApiResponse>(key, fetcher);

  // Lakukan mapping data sebelum dikembalikan ke komponen
  const data = mapKpltDetailResponse(rawData);

  return {
    data, // Data yang sudah diproses (Mapped)
    rawData, // Data mentah (jika komponen butuh akses langsung)
    isLoading,
    isError: !!error,
    error,
    mutate, // Fungsi untuk me-refresh data manual
  };
}
