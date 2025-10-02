// file: hooks/useKpltPrefill.ts

import { useMemo } from "react";
import useSWR from "swr";
import { PrefillKpltResponse, KpltBaseUIMapped } from "@/types/common";

// Fetcher tidak perlu diubah
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    try {
      (error as any).info = await res.json();
    } catch (e) {
      (error as any).info = { message: "Failed to parse error JSON." };
    }
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
};

// Fungsi mapping tidak perlu diubah
function mapKpltPrefillData(
  response: PrefillKpltResponse | undefined,
  ulokId: string | undefined
): KpltBaseUIMapped | undefined {
  if (!response?.base || !ulokId) return undefined;

  return {
    namaKplt: response.base.nama_kplt,
    alamat: response.base.alamat,
    luas: response.base.luas,
    provinsi: response.base.provinsi,
    kabupaten: response.base.kabupaten,
    kecamatan: response.base.kecamatan,
    desaKelurahan: response.base.desa_kelurahan,
    formatStore: response.base.format_store,
    hargaSewa: response.base.harga_sewa,
    namaPemilik: response.base.nama_pemilik,
    kontakPemilik: response.base.kontak_pemilik,
    approvalIntipStatus: response.base.approval_intip_status,
    tanggalApprovalIntip: response.base.tanggal_approval_intip,
    isActive: response.base.is_active,
    panjang: response.base.panjang,
    alasHak: response.base.alas_hak,
    latitude: response.base.latitude,
    longitude: response.base.longitude,
    lebarDepan: response.base.lebar_depan,
    bentukObjek: response.base.bentuk_objek,
    jumlahLantai: response.base.jumlah_lantai,
    formUlok: response.base.form_ulok ?? null,
    fileIntip: response.base.file_intip
      ? `/api/ulok/${ulokId}/file-intip`
      : null,
  };
}

/**
 * Hook untuk mengambil data prefill KPLT berdasarkan ID ULOK.
 * @param ulokId ID dari ULOK.
 */
export function useKpltPrefill(ulokId: string | undefined) {
  // ===================== PERUBAHAN DI SINI =====================
  // URL disesuaikan dengan struktur route baru Anda, dimana ID ada di akhir.
  const key = ulokId ? `/api/kplt/prefill?ulok_id=${ulokId}` : null;
  // =============================================================

  const {
    data: rawData,
    error,
    isLoading,
  } = useSWR<PrefillKpltResponse>(key, fetcher);

  // Optimasi useMemo tetap dipertahankan
  const data = useMemo(
    () => mapKpltPrefillData(rawData, ulokId),
    [rawData, ulokId]
  );

  return {
    data,
    rawData,
    isLoading,
    isError: !!error,
    error,
  };
}
