"use client";

import { SWRConfig } from "swr";

/**
 * SWRProvider
 * ------------------------------
 * Provider global untuk konfigurasi SWR di seluruh aplikasi.
 *
 * Komponen ini ditaruh di client-side karena SWR hanya berjalan
 * pada lingkungan browser (client).
 *
 * Fungsi utama:
 * - Menyediakan fetcher default untuk seluruh request SWR.
 * - Mengatur perilaku caching, revalidasi, dan retry.
 */

export default function SWRProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SWRConfig
      value={{
        /**
         * Custom Fetcher
         * --------------------------------------------
         * - Semua request akan menyertakan `credentials: "include"`
         *   untuk mengirim cookie ke server.
         * - Jika response bukan status OK (2xx), error akan dilempar
         *   beserta status code dan pesan dari server.
         */
        fetcher: async (url: string) => {
          const res = await fetch(url, { credentials: "include" });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Fetch error (${res.status}): ${text}`);
          }

          return res.json();
        },

        /**
         * dedupingInterval
         * --------------------------------------------
         * Mencegah pemanggilan API berulang-ulang dalam waktu dekat.
         * Default: 60 detik. (Request dengan URL yang sama tidak akan
         * dipanggil berkali-kali selama interval ini.)
         */
        dedupingInterval: 60_000,

        /**
         * revalidateOnFocus
         * --------------------------------------------
         * False → Tidak melakukan fetch ulang saat user kembali ke tab browser.
         */
        revalidateOnFocus: false,

        /**
         * revalidateIfStale
         * --------------------------------------------
         * False → Tidak revalidate otomatis jika data stale.
         * Cocok untuk aplikasi yang tidak membutuhkan auto-refresh.
         */
        revalidateIfStale: false,

        /**
         * revalidateOnReconnect
         * --------------------------------------------
         * False → Tidak otomatis fetch ulang ketika koneksi kembali.
         */
        revalidateOnReconnect: false,

        /**
         * errorRetryCount
         * --------------------------------------------
         * Berapa kali SWR mencoba mengulang fetch jika gagal.
         * Default diset 1 kali.
         */
        errorRetryCount: 1,
      }}
    >
      {children}
    </SWRConfig>
  );
}
