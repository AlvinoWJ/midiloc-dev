//detail Ulok dari API (pakai SWR)
"use client";
import useSWR from "swr";
import { UlokRow } from "@/types/ulok";

// Definisikan tipe untuk respons API mentah
// Ini mencerminkan struktur `data.data[0]`
type UlokApiResponse = {
  data: UlokRow[];
};

const fetcher = async (url: string): Promise<UlokApiResponse> => {
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) throw new Error(`Fetch error ${r.status}`);
  return r.json();
};

// 👇 2. Definisikan tipe untuk data yang sudah bersih/ter-mapping
//    Ini adalah struktur yang akan digunakan oleh komponen UI Anda
export type MappedUlokData = {
  id: any; // Sebaiknya ganti 'any' dengan tipe ID Anda, misal: number atau string
  namaUlok: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  kelurahan: string;
  alamat: string;
  latlong: string;
  tanggalUlok: string; // atau Date
  formatStore: string;
  bentukObjek: string;
  alasHak: string;
  jumlahlantai: string;
  lebardepan: string;
  panjang: string;
  luas: string;
  hargasewa: string;
  namapemilik: string;
  kontakpemilik: string;
  approval_status: string;
  file_intip: string | null;
  tanggal_approval_intip: string | null; // atau Date
  approval_intip: string | null;

  latitude: number | null;
  longitude: number | null;
  namaUser: string | null;
  formulok: string | null;

  updated_at: string | null;
  updated_by: {
    nama: string;
  } | null;

  approved_at: string | null;
  approved_by: { nama: string } | null;
};

// 👇 3. Tambahkan tipe pada nilai kembalian hook
type UseUlokDetailReturn = {
  ulokData: MappedUlokData | null;
  isLoading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorMessage: any;
  refresh: () => void;
};

export function useUlokDetail(id: string | undefined): UseUlokDetailReturn {
  // 👇 4. Beri tahu SWR tentang tipe data API mentah
  const { data, error, isLoading, mutate } = useSWR<UlokApiResponse>(
    id ? `/api/ulok/${id}` : null,
    fetcher
  );

  // TypeScript sekarang tahu bahwa `data` adalah UlokApiResponse | undefined
  const raw = data?.data?.[0];

  // Map data mentah ke format yang bersih.
  // Pastikan `mapped` sesuai dengan tipe `MappedUlokData`
  const mapped: MappedUlokData | null = raw
    ? {
        id: raw.id,
        namaUlok: raw.nama_ulok,
        provinsi: raw.provinsi,
        kabupaten: raw.kabupaten,
        kecamatan: raw.kecamatan,
        kelurahan: raw.desa_kelurahan,
        alamat: raw.alamat,
        latlong: `${raw.latitude}, ${raw.longitude}`,
        tanggalUlok: raw.created_at,
        formatStore: raw.format_store,
        bentukObjek: raw.bentuk_objek,
        alasHak: String(raw.alas_hak),
        jumlahlantai: String(raw.jumlah_lantai),
        lebardepan: String(raw.lebar_depan),
        panjang: String(raw.panjang),
        luas: String(raw.luas),
        hargasewa: `Rp ${new Intl.NumberFormat("id-ID").format(
          raw.harga_sewa
        )}`,
        namapemilik: raw.nama_pemilik,
        kontakpemilik: raw.kontak_pemilik,
        approval_status: raw.approval_status,
        file_intip: raw.file_intip,
        tanggal_approval_intip: raw.tanggal_approval_intip,
        approval_intip: raw.approval_intip,
        latitude: raw.latitude,
        longitude: raw.longitude,
        namaUser: raw.users?.nama ?? null,
        formulok: raw.form_ulok,

        updated_at: raw.updated_at ?? null,
        updated_by: raw.updated_by ?? null,

        approved_at: raw.approved_at ?? null,
        approved_by: raw.approved_by ?? null,
      }
    : null;

  return {
    ulokData: mapped,
    isLoading: isLoading,
    errorMessage: error,
    refresh: () => mutate(),
  };
}
