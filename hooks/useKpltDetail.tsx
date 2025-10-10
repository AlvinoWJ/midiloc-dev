// hooks/useKpltDetail.ts

import useSWR from "swr";
import { KpltBaseUIMapped } from "@/types/common";

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

export type KpltDetailData = {
  id: string;
  ulok_id: string;
  nama_kplt: string;
  alamat: string;
  luas: number;
  panjang: number;
  lebar_depan: number;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa_kelurahan: string;
  latitude: string;
  longitude: string;
  format_store: string;
  harga_sewa: number;
  nama_pemilik: string;
  kontak_pemilik: string;
  alas_hak: string;
  bentuk_objek: string;
  jumlah_lantai: number;
  is_active: boolean;
  form_ulok: string | null;
  file_intip: string | null;
  approval_intip_status: string;
  tanggal_approval_intip: string | null;
  kplt_approval: string; // Status approval KPLT baru
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
  pdf_form_ukur: string | null;
  peta_coverage: string | null;
  pdf_pembanding: string | null;
  counting_kompetitor: string | null;
  video_360_malam: string | null;
  video_360_siang: string | null;
  video_traffic_malam: string | null;
  video_traffic_siang: string | null;
};

/**
 * Merepresentasikan struktur JSON lengkap dari endpoint GET /api/kplt/:id
 */
export type KpltDetailApiResponse = {
  kplt: KpltDetailData;
  approvals: ApprovalDetail[]; // Menggunakan tipe yang lebih spesifik
  approvals_summary: {
    bm: ApprovalSummaryDetail | null; // Tipe yang benar adalah objek, bukan string
    gm: ApprovalSummaryDetail | null;
    rm: ApprovalSummaryDetail | null;
  };
};

export type ApprovalsSummary = KpltDetailApiResponse["approvals_summary"];

export type MappedKpltDetail = {
  base: KpltBaseUIMapped;
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

  const createFileUrl = (fileName: string | null) =>
    fileName ? `/api/files/kplt/${kplt.id}/${fileName}` : null;

  return {
    base: {
      // Data dasar KPLT dalam camelCase
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
      fileIntip: kplt.file_intip
        ? `/api/ulok/${kplt.ulok_id}/file-intip`
        : null,
      approvalIntipStatus: kplt.approval_intip_status,
      tanggalApprovalIntip: kplt.tanggal_approval_intip,
      kpltapproval: kplt.kplt_approval || "",
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
      pdfKks: createFileUrl(kplt.pdf_kks),
      excelPe: createFileUrl(kplt.excel_pe),
      pdfFoto: createFileUrl(kplt.pdf_foto),
      excelFpl: createFileUrl(kplt.excel_fpl),
      pdfFormUkur: createFileUrl(kplt.pdf_form_ukur),
      petaCoverage: createFileUrl(kplt.peta_coverage),
      pdfPembanding: createFileUrl(kplt.pdf_pembanding),
      countingKompetitor: createFileUrl(kplt.counting_kompetitor),
      video360Malam: createFileUrl(kplt.video_360_malam),
      video360Siang: createFileUrl(kplt.video_360_siang),
      videoTrafficMalam: createFileUrl(kplt.video_traffic_malam),
      videoTrafficSiang: createFileUrl(kplt.video_traffic_siang),
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
