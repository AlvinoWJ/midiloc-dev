"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useUlokDetail } from "@/hooks/useUlokDetail";
import { useAlert } from "@/components/desktop/alertcontext";
import { UlokUpdateInput } from "@/lib/validations/ulok";
import DesktopDetailUlok from "@/components/desktop/detail-ulok-layout";
import InputIntipForm from "@/components/ui/inputintip";

export default function DetailPage() {
  // --- SETUP & HOOKS ---
  const { id } = useParams<{ id: string }>();
  const { ulokData, isLoading, errorMessage, refresh } = useUlokDetail(id);
  const { showToast, showConfirmation } = useAlert();
  const [showIntipForm, setShowIntipForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingIntip, setIsSubmittingIntip] = useState(false);
  const isPageLoading = isLoading;

  // --- API HANDLERS (Fungsi-fungsi ini tetap di sini karena ini adalah "otak" dari halaman) ---

  const handleSaveData = async (
    data: UlokUpdateInput | FormData
  ): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      let response;

      // Cek tipe data yang dikirim dari hook
      if (data instanceof FormData) {
        // Jika data adalah FormData, kirim sebagai multipart/form-data
        // Ini untuk use case upload file form_ulok
        response = await fetch(`/api/ulok/${id}`, {
          method: "PATCH",
          body: data,
          // Header 'Content-Type' tidak perlu di-set, browser akan menanganinya
        });
      } else {
        // Jika bukan, kirim sebagai JSON biasa untuk update data teks
        response = await fetch(`/api/ulok/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      // Penanganan error yang konsisten untuk kedua jenis request
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal menyimpan perubahan.");
      }

      showToast({
        type: "success",
        title: "Berhasil",
        message: "Data ULOK telah diperbarui.",
      });
      await refresh(); // Muat ulang data untuk menampilkan perubahan
      return true; // Sinyal sukses ke hook
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Gagal Menyimpan",
        message: error.message || "Gagal menyimpan pembaruan.",
      });
      return false; // Sinyal gagal ke hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIntipSubmit = async (formData: FormData) => {
    setIsSubmittingIntip(true);
    try {
      const response = await fetch(`/api/ulok/${id}`, {
        method: "PATCH",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal menyimpan data intip.");
      }
      showToast({
        type: "success",
        title: "Berhasil",
        message: "Data intip berhasil disimpan!",
        duration: 4000,
      });
      setShowIntipForm(false);
      await refresh();
    } catch (error: unknown) {
      let message = "Terjadi kesalahan saat menyimpan data intip.";
      if (error instanceof Error) {
        message = error.message;
      }
      showToast({
        type: "error",
        title: "Gagal Menyimpan Data Intip",
        message,
      });
    } finally {
      setIsSubmittingIntip(false);
    }
  };

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

    // State isApproving dikelola di dalam komponen layout masing-masing,
    // jadi tidak perlu state di sini. Fungsi ini hanya berisi logika API.
    try {
      const fd = new FormData();
      fd.append("approval_status", status);
      const res = await fetch(`/api/ulok/${id}`, {
        method: "PATCH",
        body: fd,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal update status.");
      }
      showToast({
        type: "success",
        title: "Status berhasil diubah",
        message: `Approval status telah diubah menjadi ${status}`,
      });
      await refresh();
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Gagal Mengubah Status",
        message: e.message || "Terjadi kesalahan saat mengupdate status",
      });
    }
  };

  // Menampilkan pesan error jika gagal mengambil data
  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center text-red-500">
        Gagal memuat data: {(errorMessage as Error).message}
      </div>
    );
  }

  // 1. Tangani state saat deteksi perangkat sedang berjalan
  if (isLoading) {
    const loadingProps = {
      isLoading: true,
      initialData: null as any, // Diberi `null` karena skeleton tidak butuh data
      onSave: async () => false,
      isSubmitting: false,
      onOpenIntipForm: () => {},
      onApprove: () => {},
      fileIntipUrl: null,
      formulokUrl: null,
    };

    return (
      <>
        {/* Versi Desktop: Tersembunyi di layar kecil, tampil di layar 'md' ke atas */}
        <div className="hidden md:block">
          <DesktopDetailUlok {...loadingProps} />
        </div>
      </>
    );
  }

  // 2. Setelah deteksi perangkat selesai, lanjutkan dengan logika seperti biasa
  const pageIsDataLoading = isLoading;

  if (!pageIsDataLoading && !ulokData) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center">
        Data tidak ditemukan.
      </div>
    );
  }

  const pageProps = {
    isLoading: isPageLoading,
    initialData: ulokData!,
    onSave: handleSaveData,
    isSubmitting,
    onOpenIntipForm: () => setShowIntipForm(true),
    onApprove: handleSetApproval,
    fileIntipUrl: ulokData?.file_intip
      ? `/api/ulok/${ulokData.id}/file-intip`
      : null,
    formulokUrl: ulokData?.formulok
      ? `/api/ulok/${ulokData.id}/form-ulok`
      : null,
  };

  return (
    <>
      <DesktopDetailUlok {...pageProps} />

      {/* Modal dirender di level ini agar bisa tampil di atas layout manapun */}
      {showIntipForm && (
        <InputIntipForm
          onClose={() => setShowIntipForm(false)}
          onSubmit={handleIntipSubmit}
          isSubmitting={isSubmittingIntip}
        />
      )}
    </>
  );
}
