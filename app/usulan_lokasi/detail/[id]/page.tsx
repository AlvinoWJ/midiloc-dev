"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";
import DetailUlok from "@/components/detailulok";
import { useSidebar } from "@/components/ui/sidebarcontext";
import { UlokUpdateInput } from "@/lib/validations/ulok";
import InputIntipForm from "@/components/inputintip";
import { ApprovalStatusPanel } from "@/components/approvalstatus";
import { useUser } from "@/app/hooks/useUser";
import { useUlokDetail } from "@/app/hooks/useUlokDetail";
import SWRProvider from "@/app/swr-provider";

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmittingIntip(false);
    }
  };

  // Approve (LM multipart)
  const handleSetApproval = async (status: "OK" | "NOK") => {
    if (!id) return;
    if (!ulokData?.file_intip) {
      alert("Tidak bisa mengubah status. File Intip belum diupload.");
      return;
    }
    if (!confirm(`Ubah approval_status menjadi ${status}?`)) return;
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
      alert(`Status berhasil diubah ke ${status}`);
      await refresh();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      alert(e.message);
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
      return (
        <p className="text-center py-10 text-gray-500">Memuat detail...</p>
      );
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
          <ApprovalStatusPanel
            currentStatus={ulokData?.approval_status || null}
            disabled={isApproving}
            onApprove={handleSetApproval}
            show={canApprove && intipCompleted}
            fileUploaded={intipCompleted}
          />

          {/* Jika LM tapi belum ada file_intip, tampilkan info pengingat */}
          {canApprove && !intipCompleted && (
            <div className="mt-6 border rounded bg-white p-4 text-sm text-gray-700">
              <p>
                Approval belum tersedia karena Intip belum diupload. Silakan
                klik tombol Input Intip terlebih dahulu.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
