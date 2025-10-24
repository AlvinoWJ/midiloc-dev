"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useUlokDetail } from "@/hooks/useUlokDetail";
import { useAlert } from "@/components/shared/alertcontext";
import { UlokUpdateInput } from "@/lib/validations/ulok";
import DetailUlokLayout from "@/components/detail_ulok_layout";
import { invalidate } from "@/lib/swr-invalidate";

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const { ulokData, isLoading, errorMessage, refresh } = useUlokDetail(id);
  const { showToast, showConfirmation } = useAlert();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPageLoading = isLoading;

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
      invalidate.ulok();
      invalidate.ulokDetail(id);
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

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center text-red-500">
        Gagal memuat data: {(errorMessage as Error).message}
      </div>
    );
  }

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

  if (!ulokData) {
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
    onApprove: handleSetApproval,
    formulokUrl: ulokData?.formulok
      ? `/api/ulok/${ulokData.id}/form-ulok`
      : null,
  };

  return (
    <>
      <DetailUlokLayout {...pageProps} />
    </>
  );
}
