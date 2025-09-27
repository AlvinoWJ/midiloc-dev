import { PrefillKpltResponse } from "@/types/common";

// Tipe MappedKpltData tidak perlu diubah
export type MappedKpltData = {
  ulokId: string;
  namaKplt: string;
  alamat: string;
  luas: number;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  formatStore: string;
  hargaSewa: number;
  pemilik: string;
  kontakPemilik: string;
  approvalStatus: string;
  tanggalApprovalIntip: string | null;
  isActive: boolean;
  panjang: number;
  alasHak: string;
  latitude: string;
  longitude: string;
  lebarDepan: number;
  bentukObjek: string;
  jumlahLantai: number;
  formUlok: string | null;
  fileIntip: string | null;
};

// Ganti fungsi mapping Anda dengan versi yang sudah diperbaiki ini
export function mapKpltRowToMappedData(
  response: PrefillKpltResponse | undefined
): MappedKpltData | undefined {
  if (!response) return undefined;

  return {
    ulokId: response.ulok_id,
    namaKplt: response.base.nama_kplt,
    alamat: response.base.alamat,
    luas: response.base.luas,
    provinsi: response.base.provinsi,
    kabupaten: response.base.kabupaten,
    kecamatan: response.base.kecamatan,
    desa: response.base.desa_kelurahan,
    formatStore: response.base.format_store,
    hargaSewa: response.base.harga_sewa,
    pemilik: response.base.nama_pemilik,
    kontakPemilik: response.base.kontak_pemilik,
    approvalStatus: response.base.approval_intip_status,
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
    // file_intip diarahkan ke endpoint ulok/file-intip agar konsisten
    fileIntip: response.base.file_intip
      ? `/api/ulok/${response.ulok_id}/file-intip`
      : null,
  };
}
