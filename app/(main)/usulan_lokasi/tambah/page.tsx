"use client";

/**
 * TambahUlokPage
 * --------------
 * Halaman untuk menambahkan Usulan Lokasi (ULok) baru.
 *
 * Fitur utama:
 * - Menangani submission form tambah data ULok
 * - Konversi data input menjadi `FormData` untuk mendukung upload file
 * - Integrasi dengan API endpoint `/api/ulok` (POST)
 * - Feedback user menggunakan Toast (Sukses/Gagal)
 * - Navigasi otomatis kembali ke daftar ULok setelah sukses
 * - Invalidasi cache SWR agar data terbaru langsung muncul
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UlokCreateInput } from "@/lib/validations/ulok";
import { useAlert } from "@/components/shared/alertcontext";
import { invalidate } from "@/lib/swr-invalidate";
import TambahUlokForm from "@/components/layout/tambah_ulok_layout";

export default function TambahUlokPage() {
  /**
   * Hook navigasi untuk redirect halaman.
   */
  const router = useRouter();

  /**
   * Hook untuk menampilkan notifikasi toast.
   */
  const { showToast } = useAlert();

  /**
   * State untuk menampung status loading saat proses submit berlangsung.
   * Digunakan untuk disable tombol simpan agar tidak terjadi double submit.
   */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handler utama saat form disubmit.
   * Menerima data yang sudah divalidasi (UlokCreateInput).
   *
   * Proses:
   * 1. Mengubah object data menjadi instance `FormData` (karena ada potensi upload file).
   * 2. Mengirim data ke API.
   * 3. Melakukan invalidasi cache data ULok.
   * 4. Redirect ke halaman list jika sukses.
   */
  const handleFormSubmit = async (data: UlokCreateInput) => {
    setIsSubmitting(true);
    try {
      // Inisialisasi FormData
      const formData = new FormData();

      // Loop setiap key dalam data input untuk dimasukkan ke FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          // Jika value adalah File (gambar/dokumen), append langsung
          // Jika bukan, konversi ke string
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      // Request ke API
      const response = await fetch("/api/ulok", {
        method: "POST",
        body: formData,
      });

      // Trigger re-fetch data di halaman list agar data baru muncul
      invalidate.ulok();

      const resJson = await response.json();

      // Handle response error dari server
      if (!response.ok) {
        throw new Error(
          resJson.error || "Terjadi kesalahan saat menyimpan data."
        );
      }

      // Tampilkan notifikasi sukses
      showToast({
        type: "success",
        title: "Berhasil",
        message: "Usulan Lokasi baru telah berhasil disimpan!",
      });

      // Redirect ke halaman index/list
      router.push("/usulan_lokasi");
    } catch (err: unknown) {
      // Tampilkan notifikasi error
      showToast({
        type: "error",
        title: "Gagal Menyimpan",
        message:
          err instanceof Error
            ? err.message
            : "Gagal menghubungi server. Coba lagi nanti.",
      });
    } finally {
      // Matikan status loading
      setIsSubmitting(false);
    }
  };

  /**
   * Props yang diteruskan ke layout Form Tambah ULok.
   */
  const formProps = {
    onSubmit: handleFormSubmit,
    isSubmitting: isSubmitting,
  };

  /**
   * Render layout form dengan props yang sudah disiapkan.
   */
  return <TambahUlokForm {...formProps} />;
}
