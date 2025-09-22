"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import SWRProvider from "@/app/swr-provider";
import { useDevice } from "@/app/context/DeviceContext";
import { useUlokDetail } from "@/hooks/useUlokDetail";
import { useAlert } from "@/components/desktop/alertcontext";
import { UlokUpdateInput } from "@/lib/validations/ulok";
import DesktopDetailUlok from "@/components/desktop/detail-ulok-layout";
import MobileDetailUlok from "@/components/mobile/detail-ulok-layout";
import InputIntipForm from "@/components/ui/inputintip";

// Komponen Wrapper untuk SWR, tidak berubah
export default function DetailPageWrapper() {
  return (
    <SWRProvider>
      <DetailPage />
    </SWRProvider>
  );
}

// Komponen Halaman Inti
export function DetailPage() {
  // --- SETUP & HOOKS ---
  const { id } = useParams<{ id: string }>();
  const { isMobile } = useDevice();
  const { ulokData, isLoading, errorMessage, refresh } = useUlokDetail(id);
  const { showToast, showConfirmation } = useAlert();
  const [showIntipForm, setShowIntipForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingIntip, setIsSubmittingIntip] = useState(false);
  const isPageLoading = isLoading;

  // --- API HANDLERS (Fungsi-fungsi ini tetap di sini karena ini adalah "otak" dari halaman) ---

  const handleSaveData = async (data: UlokUpdateInput): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      await fetch(`/api/ulok/${id}`, {
        // Menggunakan path relatif lebih baik
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      showToast({
        type: "success",
        title: "Berhasil",
        message: "Data ULOK telah diperbarui.",
      });
      await refresh();
      return true;
    } catch (error) {
      showToast({
        type: "error",
        title: "Gagal",
        message: "Gagal menyimpan pembaruan.",
      });
      return false;
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
    // Buat props dummy untuk skeleton. initialData harus ada untuk menghindari error props.
    const loadingProps = {
      isLoading: true,
      initialData: null as any, // Diberi `null` karena skeleton tidak butuh data
      // Sisa props bisa di-dummy karena tidak akan digunakan oleh skeleton
      onSave: async () => false,
      isSubmitting: false,
      onOpenIntipForm: () => {},
      onApprove: () => {},
      fileIntipUrl: null,
    };

    return (
      <>
        {/* Versi Mobile: Tampil di layar kecil, tersembunyi di layar 'md' ke atas */}
        <div className="md:hidden">
          <MobileDetailUlok {...loadingProps} />
        </div>
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
  };

  return (
    <>
      {isMobile ? (
        <MobileDetailUlok {...pageProps} />
      ) : (
        <DesktopDetailUlok {...pageProps} />
      )}

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
