"use client";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) throw new Error(`Fetch error ${r.status}`);
  return r.json();
};

export function useUlokDetail(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/ulok/${id}` : null,
    fetcher
  );

  // Asumsi data.data[0]
  const raw = data?.data?.[0];
  const mapped = raw
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
        nama_pengusul: raw.users.nama,
        no_telp: String(raw.users.no_telp),
      }
    : null;

  return {
    ulokData: mapped,
    isLoading: isLoading,
    errorMessage: error,
    refresh: () => mutate(),
  };
}
