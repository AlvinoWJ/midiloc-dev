// hooks/useKpltDetail.ts

import useSWR from "swr";
import { KpltBaseUIMapped, KpltBaseData } from "@/types/common";

// =========================================================================
// DEFINISI TIPE BARU UNTUK API DETAIL KPLT
// =========================================================================

// --- Tipe baru untuk detail masing-masing approval ---
export type ApprovalDetail = {
  id: string;
  kplt_id: string;
  created_at: string;
  approved_at: string;
  approved_by: string;
  is_approved: boolean;
  position_nama: string;
};

// --- Tipe baru untuk ringkasan approval per peran ---
export type ApprovalSummaryDetail = {
  approved_at: string;
  approved_by: string;
  is_approved: boolean;
};

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
  // --- Nama File ---
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
  // --- Data INTIP & Form Ukur dari KPLT ---
  approval_intip: string | null;
  tanggal_approval_intip: string | null;
  file_intip: string | null;
  tanggal_ukur: string | null;
  form_ukur: string | null;
};

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
// FUNGSI FETCHER UNTUK SWR
// =========================================================================
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
    throw new FetchError( // Gunakan class yang baru didefinisikan
      "An error occurred while fetching the data.",
      errorInfo,
      res.status
    );
  }
  return res.json();
};

// =========================================================================
// FUNGSI MAPPING BARU
// =========================================================================
function mapKpltDetailResponse(
  data: KpltDetailApiResponse | undefined
): MappedKpltDetail | undefined {
  if (!data || !data.kplt) return undefined;

  const { kplt, approvals, approvals_summary } = data;
  const kpltId = kplt.id;

  const formatDisplayDate = (isoDate: string | null) => {
    if (!isoDate) return null;
    try {
      return new Date(isoDate).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return null; // Return null jika tanggal tidak valid
    }
  };

  const formatTanggal = (tanggalISO: string | null): string => {
    if (!tanggalISO) return "-";
    return new Date(tanggalISO).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const createFileDisplayUrl = (filePath: string | null): string | null => {
    if (!filePath) return null;
    const cleanPath = filePath.replace(/^file_storage\//, "");
    return `/api/kplt/${kpltId}/files?path=${encodeURIComponent(cleanPath)}`;
  };

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
      formUlok: kplt.form_ulok ? `/api/ulok/${kplt.ulok_id}/form-ulok` : null, // Asumsi ini benar
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
    approvals: approvals,
    approvalsSummary: approvals_summary,
  };
}

// =========================================================================
// CUSTOM HOOK DENGAN SWR
// =========================================================================
export function useKpltDetail(id: string | undefined) {
  const key = id ? `/api/kplt/${id}` : null;

  const {
    data: rawData, // Data mentah dari API
    error,
    isLoading,
    mutate,
  } = useSWR<KpltDetailApiResponse>(key, fetcher);
  const data = mapKpltDetailResponse(rawData);

  return {
    data,
    rawData,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
