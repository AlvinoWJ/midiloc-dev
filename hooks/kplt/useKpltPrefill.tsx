import { useMemo } from "react";
import useSWR from "swr";
import { PrefillKpltResponse, KpltBaseUIMapped } from "@/types/common";

/**
 * Fetcher standar untuk SWR.
 * Menangani respon HTTP non-2xx dengan melempar error
 * yang berisi detail pesan dari body response JSON.
 */
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    try {
      // Coba ambil detail error dari JSON response backend
      (error as any).info = await res.json();
    } catch (e) {
      // Fallback jika response bukan JSON valid
      (error as any).info = { message: "Failed to parse error JSON." };
    }
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
};

/**
 * Mapper: Mengubah data response API (Prefill) menjadi struktur UI.
 * - Mengubah snake_case (API) menjadi camelCase (Frontend).
 * - Membentuk URL lengkap untuk download file jika path tersedia.
 */
function mapKpltPrefillData(
  response: PrefillKpltResponse | undefined,
  ulokId: string | undefined
): KpltBaseUIMapped | undefined {
  // Guard: Jika data belum ada atau ULOK ID hilang, return undefined
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

    isActive: response.base.is_active,
    panjang: response.base.panjang,
    alasHak: response.base.alas_hak,
    latitude: response.base.latitude,
    longitude: response.base.longitude,
    lebarDepan: response.base.lebar_depan,
    bentukObjek: response.base.bentuk_objek,
    jumlahLantai: response.base.jumlah_lantai,
    // Generate URL endpoint untuk download file Form Ulok
    formUlok: response.base.form_ulok ? `/api/ulok/${ulokId}/form-ulok` : null,
  };
}

/**
 * useKpltPrefill Hook
 * -------------------
 * Mengambil data awal (prefill) untuk form pembuatan KPLT
 * berdasarkan ID Usulan Lokasi (ULOK) yang dipilih.
 */
export function useKpltPrefill(ulokId: string | undefined) {
  // Conditional Fetching SWR:
  // Jika ulokId kosong/undefined, set key ke null agar SWR tidak melakukan request.
  const key = ulokId ? `/api/kplt/prefill?ulok_id=${ulokId}` : null;

  const {
    data: rawData,
    error,
    isLoading,
  } = useSWR<PrefillKpltResponse>(key, fetcher);

  // Optimasi: Mapping data hanya dijalankan ulang jika rawData atau ulokId berubah.
  // Mencegah re-calculation yang tidak perlu pada setiap render component.
  const data = useMemo(
    () => mapKpltPrefillData(rawData, ulokId),
    [rawData, ulokId]
  );

  return {
    data, // Data yang sudah diproses (Ready for UI)
    rawData, // Data mentah dari API
    isLoading,
    isError: !!error,
    error,
  };
}
