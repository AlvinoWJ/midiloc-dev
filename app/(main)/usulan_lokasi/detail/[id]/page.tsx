"use client";

/**
 * DetailPage
 * ----------
 * Halaman detail Usulan Lokasi (ULok) yang menampilkan:
 * - Informasi lengkap data ULok berdasarkan ID
 * - Form untuk edit data
 * - Aksi Approval (Setuju/Tolak)
 *
 * Fitur utama:
 * - Mengambil data detail menggunakan hook `useUlokDetail`
 * - Menangani penyimpanan data (Update) baik format JSON maupun FormData (Upload File)
 * - Menangani perubahan status approval (OK/NOK) dengan konfirmasi
 * - Mengelola feedback user (Toast & Alert) via `useAlert`
 * - Integrasi dengan `DetailUlokLayout` sebagai wrapper UI
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUlokDetail } from "@/hooks/ulok/useUlokDetail";
import { useAlert } from "@/components/shared/alertcontext";
import { UlokUpdateInput } from "@/lib/validations/ulok";
import DetailUlokLayout from "@/components/layout/detail_ulok_layout";
import { invalidate } from "@/lib/swr-invalidate";

export default function DetailPage() {
  /**
   * Mengambil ID dari parameter URL.
   */
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  /**
   * Hook custom untuk fetching data detail ULok.
   * Mengembalikan:
   * - ulokData -> Data detail object
   * - isLoading -> Status loading fetch
   * - errorMessage -> Error object jika fetch gagal
   * - refresh -> Fungsi untuk memicu fetch ulang (revalidate)
   */
  const { ulokData, isLoading, errorMessage, refresh } = useUlokDetail(id);

  /**
   * Context untuk menampilkan notifikasi (Toast) dan dialog konfirmasi.
   */
  const { showToast, showConfirmation } = useAlert();

  /**
   * State loading khusus saat tombol simpan ditekan.
   */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handler untuk menyimpan perubahan data ULok.
   * Mendukung dua tipe payload:
   * 1. FormData: Jika ada upload file
   * 2. JSON: Jika hanya update data teks biasa
   * * Juga melakukan invalidasi cache SWR agar data di list terupdate.
   */
  const handleSaveData = async (
    data: UlokUpdateInput | FormData
  ): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      let response;
      if (data instanceof FormData) {
        response = await fetch(`/api/ulok/${id}`, {
          method: "PATCH",
          body: data,
        });
        // Invalidate cache global dan detail agar data sinkron
        invalidate.ulok();
        invalidate.ulokDetail(id);
      } else {
        response = await fetch(`/api/ulok/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        invalidate.ulok();
        invalidate.ulokDetail(id);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal menyimpan perubahan.");
      }

      showToast({
        type: "success",
        title: "Berhasil",
        message: "Data ULOK telah diperbarui.",
      });
      await refresh();
      return true;
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Gagal Menyimpan",
        message: error.message || "Gagal menyimpan pembaruan.",
      });
      return false; // Sinyal gagal ke hook/component caller
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handler untuk mengubah status approval (OK / NOK).
   * Menampilkan dialog konfirmasi sebelum melakukan request ke API.
   * Jika sukses, user akan diarahkan kembali ke halaman list (`/usulan_lokasi`).
   */
  const handleSetApproval = async (status: "OK" | "NOK") => {
    if (!id) return;
    const confirmed = await showConfirmation({
      title: "Konfirmasi Perubahan Status",
      message:
        status === "OK"
          ? `Apakah Anda yakin ingin menyetujui ${ulokData?.namaUlok}?`
          : `Apakah Anda yakin ingin menolak ${ulokData?.namaUlok}?`,
      confirmText: status === "OK" ? "Ya, Setujui" : "Ya, Tolak",
      cancelText: "Batal",
      type: status === "OK" ? "success" : "error",
    });

    if (!confirmed) return;

    try {
      const payload = { approval_status: status };
      const res = await fetch(`/api/ulok/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal update status.");
      }
      invalidate.ulok();
      showToast({
        type: "success",
        title: "Status berhasil diubah",
        message: `Approval status telah diubah menjadi ${status}`,
      });
      router.push("/usulan_lokasi");
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Gagal Mengubah Status",
        message: e.message || "Terjadi kesalahan saat mengupdate status",
      });
    }
  };

  /**
   * Render kondisi Error.
   */
  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center text-red-500">
        Gagal memuat data: {(errorMessage as Error).message}
      </div>
    );
  }

  /**
   * Render kondisi Loading.
   * Menampilkan layout dengan props dummy/kosong agar kerangka UI tetap muncul (Skeleton).
   */
  if (isLoading) {
    const loadingProps = {
      isLoading: true,
      initialData: null as any,
      onSave: async () => false,
      isSubmitting: false,
      onOpenIntipForm: () => {},
      onApprove: () => {},
      fileIntipUrl: null,
      formulokUrl: null,
    };

    return (
      <>
        <div className="hidden md:block">
          <DetailUlokLayout {...loadingProps} />
        </div>
      </>
    );
  }

  /**
   * Render kondisi Data Tidak Ditemukan (404 logic).
   */
  if (!ulokData) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center">
        Data tidak ditemukan.
      </div>
    );
  }

  /**
   * Props final yang akan diteruskan ke layout Detail ULok.
   * Menggabungkan data hasil fetch dan handler functions.
   */
  const pageProps = {
    isLoading: isLoading,
    initialData: ulokData!,
    onSave: handleSaveData,
    isSubmitting,
    onApprove: handleSetApproval,
    formulokUrl: ulokData?.formulok
      ? `/api/ulok/${ulokData.id}/form-ulok`
      : null,
  };

  /**
   * Render layout utama Detail ULok.
   */
  return (
    <>
      <DetailUlokLayout {...pageProps} />
    </>
  );
}
