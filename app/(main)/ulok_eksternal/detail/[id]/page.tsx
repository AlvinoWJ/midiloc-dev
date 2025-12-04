"use client";

/**
 * DetailUlokEksternalPage
 * ------------------------
 * Halaman detail ULok Eksternal yang menampilkan:
 * - Data detail ULok Eksternal berdasarkan ID URL
 * - Status loading & error ketika mengambil data
 * - Mendukung revalidate data menggunakan `mutate` (SWR)
 *
 * Fitur utama:
 * - Mengambil parameter dinamis (`id`) melalui `useParams`
 * - Mengambil detail ULok menggunakan hook: `useUlokEksternalDetail`
 * - Meneruskan seluruh data, status, dan handler ke layout
 */

import { useParams } from "next/navigation";
import { useUlokEksternalDetail } from "@/hooks/ulok_eksternal/useUlokEksternalDetail";
import DetailUlokEksternalLayout from "@/components/layout/detail_ulok_eksternal_layout";

export default function DetailUlokEksternalPage() {
  /**
   * Ambil parameter ID dari URL.
   * Jika param berupa array → ambil index pertama.
   * Jika undefined → fallback menjadi string kosong.
   */
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id || "";

  /**
   * Hook pengambilan detail ULok Eksternal berdasarkan ID.
   * Return:
   * - ulokEksternalDetail → hasil data detail
   * - isLoading → status loading saat fetch
   * - isError → status error ketika request gagal
   * - mutate → fungsi revalidate SWR untuk refresh data
   */
  const { ulokEksternalDetail, isLoading, isError, mutate } =
    useUlokEksternalDetail(id);

  /**
   * Render layout detail ULok Eksternal.
   * Semua data & status langsung diteruskan ke komponen layout.
   */
  return (
    <DetailUlokEksternalLayout
      ulok={ulokEksternalDetail ?? null} // Data detail (gunakan null jika undefined)
      isLoading={isLoading} // Status loading
      isError={!!isError} // Cast error ke boolean
      mutate={mutate} // Untuk refresh data setelah update
    />
  );
}
