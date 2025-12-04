// hooks/ulok/useUlokDetail.ts
"use client";

import useSWR from "swr";
import { UlokRow } from "@/types/ulok";

// Struktur Response Raw dari API
type UlokApiResponse = {
  data: UlokRow[];
};

/**
 * Fetcher standar untuk SWR.
 * Menggunakan `credentials: "include"` agar cookie autentikasi terkirim ke API.
 */
const fetcher = async (url: string): Promise<UlokApiResponse> => {
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) throw new Error(`Fetch error ${r.status}`);
  return r.json();
};

/**
 * MappedUlokData
 * --------------
 * View Model: Struktur data yang sudah diproses untuk kebutuhan UI.
 * Berbeda dengan UlokRow (Raw DB), tipe ini mungkin berisi data yang sudah diformat
 * (misal: hargaSewa sudah dalam format "Rp ...").
 */
export type MappedUlokData = {
  id: any;
  namaUlok: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  kelurahan: string;
  alamat: string;
  latlong: string; // Gabungan latitude & longitude
  tanggalUlok: string;
  formatStore: string;
  bentukObjek: string;
  alasHak: string;
  jumlahlantai: string;
  lebardepan: string;
  panjang: string;
  luas: string;
  hargasewa: string; // Formatted string (Rp)
  namapemilik: string;
  kontakpemilik: string;
  approval_status: string;

  // Data terkait INTIP
  file_intip: string | null;
  tanggal_approval_intip: string | null;
  approval_intip: string | null;

  latitude: number | null;
  longitude: number | null;
  namaUser: string | null; // Nama pengusul (diambil dari relasi users)
  formulok: string | null;

  // Metadata update & approval
  updated_at: string | null;
  updated_by: {
    nama: string;
  } | null;

  approved_at: string | null;
  approved_by: { nama: string } | null;
};

// Tipe return value dari hook
type UseUlokDetailReturn = {
  ulokData: MappedUlokData | null;
  isLoading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorMessage: any;
  refresh: () => void;
};

/**
 * Custom Hook: useUlokDetail
 * --------------------------
 * Mengambil satu data detail ULOK berdasarkan ID.
 * Melakukan transformasi data (Mapping) sebelum dikembalikan ke komponen.
 * @param id - ID Ulok yang akan diambil.
 */
export function useUlokDetail(id: string | undefined): UseUlokDetailReturn {
  // Conditional Fetching: Jika ID undefined/null, key SWR menjadi null (request pause)
  const { data, error, isLoading, mutate } = useSWR<UlokApiResponse>(
    id ? `/api/ulok/${id}` : null,
    fetcher
  );

  // Ambil item pertama dari array data (karena endpoint detail biasanya return array of 1)
  const raw = data?.data?.[0];

  // Logic Mapping: Raw Data -> View Model
  const mapped: MappedUlokData | null = raw
    ? {
        id: raw.id,
        namaUlok: raw.nama_ulok,
        provinsi: raw.provinsi,
        kabupaten: raw.kabupaten,
        kecamatan: raw.kecamatan,
        kelurahan: raw.desa_kelurahan,
        alamat: raw.alamat,
        // Menggabungkan lat/long menjadi satu string untuk display
        latlong: `${raw.latitude}, ${raw.longitude}`,
        tanggalUlok: raw.created_at,
        formatStore: raw.format_store,
        bentukObjek: raw.bentuk_objek,
        // Konversi tipe data ke string untuk keamanan display
        alasHak: String(raw.alas_hak),
        jumlahlantai: String(raw.jumlah_lantai),
        lebardepan: String(raw.lebar_depan),
        panjang: String(raw.panjang),
        luas: String(raw.luas),
        // Format mata uang ke Rupiah Indonesia
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
        // Mengambil nama user dari relasi (safe navigation)
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
    refresh: () => mutate(), // Fungsi untuk refresh data manual
  };
}
