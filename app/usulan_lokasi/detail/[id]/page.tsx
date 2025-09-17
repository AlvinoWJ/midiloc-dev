"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/desktop/sidebar";
import Navbar from "@/components/desktop/navbar";
import DetailUlok from "@/components/desktop/detailulok";
import { useSidebar } from "@/hooks/useSidebar";
import { UlokUpdateInput } from "@/lib/validations/ulok";
import InputIntipForm from "@/components/desktop/inputintip";
import { ApprovalStatusbutton } from "@/components/desktop/approvalbutton";
import { useUser } from "@/hooks/useUser";
import { useUlokDetail } from "@/hooks/useUlokDetail";
import SWRProvider from "@/app/swr-provider";
import { useAlert } from "@/components/desktop/alertcontext";
import { DetailUlokSkeleton } from "@/components/desktop/skleton";

export default function DetailPageWrapper() {
  // Jika nanti SWRProvider sudah ada di layout global, cukup return <UlokPage />
  return (
    <SWRProvider>
      <DetailPage />
    </SWRProvider>
  );
}

export function DetailPage() {
  const { isCollapsed } = useSidebar();
  const { id } = useParams<{ id: string }>();

  const [showIntipForm, setShowIntipForm] = useState(false);
  const [isSubmittingIntip, setIsSubmittingIntip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const { ulokData, isLoading, errorMessage, refresh } = useUlokDetail(id);
  const [isApproving, setIsApproving] = useState(false);
  const { showToast, showConfirmation } = useAlert();

  const fileIntipUrl = ulokData?.file_intip
    ? `/api/ulok/${ulokData.id}/file-intip`
    : null;

  // --- Save/Edit ---
  const handleSaveData = async (data: UlokUpdateInput): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      await fetch(`http://localhost:3000/api/ulok/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      alert("Data berhasil diperbarui!");
      await refresh();
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("Gagal menyimpan pembaruan.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Submit Intip ---
  const handleIntipSubmit = async (formData: FormData) => {
    setIsSubmittingIntip(true);
    try {
      const response = await fetch(`http://localhost:3000/api/ulok/${id}`, {
        method: "PATCH",
        body: formData,
      });
      if (!response.ok) throw new Error("Gagal menyimpan data intip.");
      alert("Data intip berhasil disimpan!");
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
        duration: 4000,
      });
    } finally {
      setIsSubmittingIntip(false);
    }
  };

  // Approve (LM multipart)
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

    setIsApproving(true);
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
      // alert(`Status berhasil diubah ke ${status}`);
      showToast({
        type: "success",
        title: "Status berhasil diubah",
        message: `Approval status telah diubah menjadi ${status}`,
        duration: 4000,
      });
      await refresh();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Gagal Mengubah Status",
        message: e.message || "Terjadi kesalahan saat mengupdate status",
        duration: 4000,
      });
    } finally {
      setIsApproving(false);
    }
  };

  const canApprove = user?.position_nama?.toLowerCase() === "location manager";
  const intipCompleted = Boolean(ulokData?.file_intip); // syarat “intip sudah dikerjakan”

  // RENDER STATES
  const renderContent = () => {
    if (!id) {
      return (
        <p className="text-center py-10 text-red-500">
          ID tidak ditemukan di URL.
        </p>
      );
    }
    if (isLoading) {
      return <DetailUlokSkeleton />;
    }
    if (errorMessage) {
      return (
        <p className="text-center py-10 text-red-500">
          Gagal memuat data: {(errorMessage as Error).message}
        </p>
      );
    }
    if (!ulokData) {
      return <p className="text-center py-10">Data tidak ditemukan.</p>;
    }
    return (
      <DetailUlok
        initialData={ulokData}
        onSave={handleSaveData}
        isSubmitting={isSubmitting}
        onOpenIntipForm={() => setShowIntipForm(true)}
        onApprove={handleSetApproval}
        fileIntipUrl={fileIntipUrl}
      />
    );
  };

  return (
    <div className="flex">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col bg-gray-50 min-h-screen transition-all duration-300 ${
          isCollapsed ? "pl-[80px]" : "pl-[270px]"
        }`}
      >
        <Navbar />

        <main className="flex-1 p-4 md:p-6 hide-scrollbar">
          {renderContent()}

          {/* Modal Input Intip */}
          {showIntipForm && (
            <InputIntipForm
              onClose={() => setShowIntipForm(false)}
              onSubmit={handleIntipSubmit}
              isSubmitting={isSubmittingIntip}
            />
          )}

          {/* Panel Approval hanya muncul jika: LM & intip sudah dikerjakan */}
          <ApprovalStatusbutton
            currentStatus={ulokData?.approval_status || null}
            disabled={isApproving}
            onApprove={handleSetApproval}
            show={canApprove && intipCompleted}
            fileUploaded={intipCompleted}
          />
        </main>
      </div>
    </div>
  );
}
