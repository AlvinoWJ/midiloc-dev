"use client";

/**
 * useUser Hook
 * ------------
 * Hook khusus untuk mengambil, menyimpan, dan memanipulasi data user
 * dari API `/api/me` menggunakan SWR.
 *
 * Hook ini berfungsi sebagai state global ringan untuk informasi user login.
 *
 * Fitur Utama:
 * - Mengambil data user dari endpoint `/api/me`
 * - Menyediakan status loading dan error
 * - Memungkinkan refresh data user
 * - Mengubah cache user secara manual (global maupun lokal)
 * - Update sebagian data user tanpa fetch ulang ke server
 *
 * Dipakai untuk:
 * - Menampilkan profil user
 * - Membatasi akses berdasarkan role/position
 * - Menyediakan state user di seluruh aplikasi tanpa context tambahan
 */

import useSWR, { mutate as globalMutate } from "swr";

/**
 * AppUser
 * -------
 * Struktur data user yang diterima dari API `/api/me`.
 * Semua properti optional karena user bisa saja null
 * saat belum login atau cookie belum valid.
 */
export type AppUser = {
  id: string;
  email?: string | null;
  nama?: string | null;
  branch_id?: string | null;
  branch_nama?: string | null;
  position_id?: string | null;
  position_nama?: string | null;
} | null;

/**
 * ApiMeResponse
 * -------------
 * Bentuk response API untuk endpoint `/api/me`.
 * API harus mengembalikan:
 * {
 *    user: AppUser
 * }
 */
interface ApiMeResponse {
  user: AppUser;
}

/**
 * useUser()
 * ---------
 * Hook utama untuk manajemen data user.
 */
export function useUser() {
  /**
   * SWR fetcher
   * -----------
   * Mengambil data dari `/api/me`.
   *
   * Konfigurasi:
   * - revalidateOnMount: true → fetch ulang saat komponen pertama kali di-mount.
   */
  const { data, error, isLoading, mutate } = useSWR<ApiMeResponse>(
    "/api/me",
    (url: string) => fetch(url).then((res) => res.json()),
    { revalidateOnMount: true }
  );

  return {
    /**
     * user
     * ----
     * Data user yang telah diparsing.
     * Jika belum login atau fetch gagal, bernilai null.
     */
    user: data?.user ?? null,

    /**
     * loadingUser
     * ------------
     * True saat SWR sedang mem-fetch data user.
     */
    loadingUser: isLoading,

    /**
     * userError
     * ----------
     * Menyimpan error dari SWR jika fetch gagal.
     */
    userError: error,

    /**
     * refreshUser()
     * --------------
     * Melakukan re-fetch terhadap user dari server.
     * Setara dengan mutate() di SWR.
     */
    refreshUser: () => mutate(),

    /**
     * setUserCache()
     * ---------------
     * Mengubah cache global data user untuk key "/api/me".
     * Tanpa revalidate ke server (false).
     *
     * Cocok saat login, update profile, atau setelah submit form.
     */
    setUserCache: (user: NonNullable<AppUser>) =>
      globalMutate("/api/me", { user }, false),

    /**
     * clearUserCache()
     * -----------------
     * Menghapus user dari cache.
     * Digunakan saat logout.
     */
    clearUserCache: () => globalMutate("/api/me", { user: null }, false),

    /**
     * updateUserLocal()
     * ------------------
     * Update sebagian properti user di cache lokal SWR,
     * tanpa mem-fetch ulang data dari server.
     *
     * Berguna untuk update kecil seperti:
     * - update nama
     * - update branch posisi
     *
     * Tetap menjaga ID user karena ini identitas utama.
     */
    updateUserLocal: (partial: Partial<NonNullable<AppUser>>) =>
      mutate((current) => {
        const prevUser = current?.user;
        if (!prevUser || !prevUser.id) return current;

        return { user: { ...prevUser, ...partial, id: prevUser.id } };
      }, false),
  };
}
