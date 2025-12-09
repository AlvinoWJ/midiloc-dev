"use client";

/**
 * DetailTokoExistingPage
 * -----------------------
 * Halaman untuk menampilkan detail dari satu Toko Existing.
 *
 * Fitur utama:
 * - Mengambil parameter `id` dari URL menggunakan `useParams`
 * - Fetch detail toko menggunakan hook `useTokoExistingDetail`
 * - Menangani loading & error
 * - Mengirim data ke layout `DetailTokoExistingLayout`
 */

import { useParams } from "next/navigation";
import DetailTokoExistingLayout from "@/components/layout/detail_toko_existing_layout";
import { useTokoExistingDetail } from "@/hooks/toko_existing/useTokoExistingDetail";

export default function DetailTokoExistingPage() {
  /**
   * Mengambil parameter URL berupa ID toko.
   * Contoh URL:
   *   /toko_existing/123
   *
   * Next.js dapat mengembalikan param sebagai array,
   * sehingga perlu distabilkan menjadi string tunggal.
   */
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  /**
   * Mengambil detail data toko dari API menggunakan SWR hook.
   *
   * Hook mengembalikan:
   * - tokoDetail → data detail toko (object)
   * - isLoading  → true jika fetch pertama kali
   * - isError    → true jika gagal mengambil data
   */
  const { tokoDetail, isLoading, isError } = useTokoExistingDetail(id);

  /**
   * Jika terjadi error saat fetch data,
   * tampilkan pesan error kepada user.
   */
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center text-red-500">
        Terjadi kesalahan saat memuat data Toko Existing.
      </div>
    );
  }

  /**
   * Render tampilan utama dengan layout detail.
   * Layout menerima:
   * - isLoading → skeleton/loader handling
   * - data      → data toko detail
   */
  return (
    <div className="container mx-auto">
      <DetailTokoExistingLayout isLoading={isLoading} data={tokoDetail} />
    </div>
  );
}
