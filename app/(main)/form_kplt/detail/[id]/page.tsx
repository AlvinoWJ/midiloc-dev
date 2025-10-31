// app/(main)/form_kplt/detail/[id]/page.tsx
"use client";

import React, { useState, useMemo, useCallback } from "react"; // Tambahkan useCallback
import { useParams } from "next/navigation";
import DetailKpltLayout from "@/components/layout/detail_kplt_layout";
import { useKpltDetail } from "@/hooks/useKpltDetail";
import { useAlert } from "@/components/shared/alertcontext";
import { useUser } from "@/hooks/useUser";

export default function DetailKpltPage() {
  const params = useParams<{ id: string }>();
  const kpltId = params?.id;

  const { showToast, showConfirmation } = useAlert(); // Tambahkan showConfirmation
  const { user } = useUser();
  const [isApproving, setIsApproving] = useState(false);
  const { data, isLoading, isError, error, mutate } = useKpltDetail(kpltId);

  // State baru untuk modal LM
  const [showIntipModal, setShowIntipModal] = useState(false);
  const [showFormUkurModal, setShowFormUkurModal] = useState(false);
  const [isSubmittingLmInput, setIsSubmittingLmInput] = useState(false);

  // Handler untuk Approval BM/RM/GM (POST/PATCH ke /approvals) - Tidak berubah
  const fetchApprovalPost = async (id: string, is_approved: boolean) => {
    const res = await fetch(`/api/kplt/${id}/approvals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_approved }),
    });
    // ... (rest of the function remains the same)
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || "Gagal mengirim status approval");
    }
    return result.data;
  };

  const fetchStatusPatch = async (id: string, newStatus: "OK" | "NOK") => {
    // Perbaiki tipe newStatus
    const res = await fetch(`/api/kplt/${id}/approvals`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // Nama field di body harus 'kplt_approval' sesuai schema validasi
      body: JSON.stringify({ kplt_approval: newStatus }),
    });
    // ... (rest of the function remains the same)
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || "Gagal memperbarui status");
    }
    return result.data;
  };

  const handleApprovalClick = async (status: "OK" | "NOK") => {
    if (!kpltId || !user?.position_nama) return;

    const position = user.position_nama.toLowerCase();
    const confirmed = await showConfirmation({
      title: `Konfirmasi Approval KPLT (${status})`,
      message: `Apakah Anda yakin ingin ${
        status === "OK" ? "menyetujui" : "menolak"
      } KPLT ini?`,
      confirmText: `Ya, ${status === "OK" ? "Setujui" : "Tolak"}`,
      cancelText: "Batal",
      type: status === "OK" ? "success" : "error",
    });

    if (!confirmed) return;

    setIsApproving(true);

    try {
      if (position === "general manager") {
        await fetchStatusPatch(kpltId, status); // Kirim 'OK' atau 'NOK'
        showToast({
          type: "success",
          message: `Status KPLT berhasil diubah menjadi ${status}!`,
        });
      } else {
        const isApproved = status === "OK";
        await fetchApprovalPost(kpltId, isApproved);
        showToast({
          type: "success",
          message: "Status approval berhasil dikirim!",
        });
      }
      await mutate();
    } catch (err: any) {
      console.error("Proses approval/set status gagal:", err);
      showToast({ type: "error", message: err.message || "Terjadi kesalahan" });
    } finally {
      setIsApproving(false);
    }
  };

  const handleIntipSubmit = useCallback(
    async (intipFormData: FormData) => {
      if (!kpltId) return;
      setIsSubmittingLmInput(true);
      try {
        const res = await fetch(`/api/kplt/${kpltId}/file_intip`, {
          method: "PATCH",
          body: intipFormData,
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || "Gagal menyimpan data Intip.");
        }
        showToast({
          type: "success",
          message: "Data Intip berhasil diperbarui.",
        });
        setShowIntipModal(false);
        await mutate();
      } catch (err: any) {
        console.error("Gagal submit Intip:", err);
        showToast({
          type: "error",
          message: err.message || "Terjadi kesalahan",
        });
      } finally {
        setIsSubmittingLmInput(false);
      }
    },
    [kpltId, mutate, showToast]
  );

  const handleFormUkurSubmit = useCallback(
    async (ukurFormData: FormData) => {
      if (!kpltId) return;
      setIsSubmittingLmInput(true);
      try {
        const res = await fetch(`/api/kplt/${kpltId}/form_ukur`, {
          method: "PATCH",
          body: ukurFormData,
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || "Gagal menyimpan data Form Ukur.");
        }
        showToast({
          type: "success",
          message: "Data Form Ukur berhasil diperbarui.",
        });
        setShowFormUkurModal(false);
        await mutate();
      } catch (err: any) {
        console.error("Gagal submit Form Ukur:", err);
        showToast({
          type: "error",
          message: err.message || "Terjadi kesalahan",
        });
      } finally {
        setIsSubmittingLmInput(false);
      }
    },
    [kpltId, mutate, showToast]
  );

  const { isAlreadyApproved, showApprovalSection } = useMemo(() => {
    if (!data || !user?.position_nama) {
      return { isAlreadyApproved: false, showApprovalSection: false };
    }

    const position = user.position_nama.toLowerCase();
    const mainStatus = data.base.kpltapproval;
    const summary = data.approvalsSummary;

    if (position === "general manager") {
      const show = mainStatus === "Waiting for Forum";
      return {
        isAlreadyApproved: mainStatus === "OK" || mainStatus === "NOK",
        showApprovalSection: show,
      };
    }

    // BM bisa approve jika status "In Progress" dan BM belum approve
    if (position === "branch manager") {
      const alreadyApproved = !!summary?.bm;
      const show = mainStatus === "In Progress" && !alreadyApproved;
      return {
        isAlreadyApproved: alreadyApproved,
        showApprovalSection: show,
      };
    }

    // RM bisa approve jika status "In Progress" dan RM belum approve
    if (position === "regional manager") {
      const AlreadyApproved = !!summary?.rm;
      const show = mainStatus === "In Progress" && !AlreadyApproved;
      return {
        isAlreadyApproved: AlreadyApproved,
        showApprovalSection: show,
      };
    }

    return { isAlreadyApproved: false, showApprovalSection: false };
  }, [data, user]);

  // Render
  return (
    <DetailKpltLayout
      id={kpltId!} // Pastikan ID tidak undefined
      data={data}
      isLoading={isLoading}
      isError={isError}
      showApprovalSection={showApprovalSection}
      isAlreadyApproved={isAlreadyApproved}
      isApproving={isApproving}
      onApprove={handleApprovalClick}
      isLocationManager={
        user?.position_nama?.toLowerCase() === "location manager"
      }
      onOpenIntipModal={() => setShowIntipModal(true)}
      onOpenFormUkurModal={() => setShowFormUkurModal(true)}
      showIntipModal={showIntipModal}
      onCloseIntipModal={() => setShowIntipModal(false)}
      onIntipSubmit={handleIntipSubmit}
      showFormUkurModal={showFormUkurModal}
      onCloseFormUkurModal={() => setShowFormUkurModal(false)}
      onFormUkurSubmit={handleFormUkurSubmit}
      isSubmittingLmInput={isSubmittingLmInput}
    />
  );
}
