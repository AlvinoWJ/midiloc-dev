import useSWR from "swr";
import { PrefillKpltResponse, KpltBaseUIMapped } from "@/types/common";

// Fungsi mapping yang sebelumnya ada di useKpltDetail.ts
function mapKpltPrefillData(
  response: PrefillKpltResponse | undefined
): KpltBaseUIMapped | undefined {
  if (!response?.base) return undefined;

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
      ? `/api/ulok/${response.ulok_id}/file-intip`
      : null,
  };
}

// Fetcher bisa kita definisikan lagi di sini atau impor dari file utilitas
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

// HOOK BARU KITA
export function useKpltPrefill(ulokId: string | undefined) {
  const key = ulokId ? `/api/ulok/${ulokId}/kplt/prefill` : null;

  const {
    data: rawData,
    error,
    isLoading,
  } = useSWR<PrefillKpltResponse>(key, fetcher);

  const data = mapKpltPrefillData(rawData);

  return {
    data, // Data yang sudah bersih
    rawData, // Data mentah, dibutuhkan untuk initialData form
    isLoading,
    isError: !!error,
    error,
  };
}
