import type { UlokCreateInput, UlokUpdateInput } from "@/lib/validations/ulok";

export type { UlokCreateInput, UlokUpdateInput };

export interface UlokRow {
  id: string;
  users_id: string;
  nama_ulok: string;
  latitude: number | null;
  longitude: number | null;
  desa_kelurahan: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  alamat: string;
  tanggal_ulok: string;
  format_store: string;
  bentuk_objek: string;
  alas_hak: string;
  jumlah_lantai: number;
  lebar_depan: number;
  panjang: number;
  luas: number;
  harga_sewa: number;
  nama_pemilik: string;
  kontak_pemilik: string;
  approval_intip: "IN PROGRESS" | "OK" | "NOK";
  tanggal_approval_intip: string | null;
  file_intip: string | null;
  approval_status: "IN PROGRESS" | "OK" | "NOK";
  approved_at: string | null;
  approved_by: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
  form_ulok: string | null;

  users?: {
    nama: string;
  } | null;
}
