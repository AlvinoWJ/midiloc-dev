"use client";

/**
 * DetailKpltPage
 * ---------------
 * Halaman detail KPLT yang menampilkan:
 * - Data KPLT lengkap berdasarkan ID
 * - Aksi approval (OK / NOK) berdasarkan jabatan user
 * - Form upload Intip & Form Ukur
 * - Modal untuk input LM (Location Manager)
 *
 * Fitur utama:
 * - Mendapatkan detail KPLT via hook `useKpltDetail`
 * - Mengatur status approval sesuai role GM / RM / BM
 * - Patch file Intip & Form Ukur
 * - Menggunakan SWR mutate + invalidate untuk refresh data
 * - Menampilkan toast / konfirmasi menggunakan AlertContext
 */

import React, { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import DetailKpltLayout from "@/components/layout/detail_kplt_layout";
import { useKpltDetail } from "@/hooks/kplt/useKpltDetail";
import { useAlert } from "@/components/shared/alertcontext";
import { useUser } from "@/hooks/useUser";
import { invalidate } from "@/lib/swr-invalidate";

export default function DetailKpltPage() {
  /**
   * Ambil parameter ID dari URL.
   */
  const params = useParams<{ id: string }>();
  const kpltId = params?.id;

  const router = useRouter();

  /**
   * Context: toast dan konfirmasi
   */
  const { showToast, showConfirmation } = useAlert();

  /**
   * Data user yang login.
   */
  const { user } = useUser();

  /**
   * State internal halaman.
   */
  const [isApproving, setIsApproving] = useState(false);
  const [showIntipModal, setShowIntipModal] = useState(false);
  const [showFormUkurModal, setShowFormUkurModal] = useState(false);
  const [isSubmittingLmInput, setIsSubmittingLmInput] = useState(false);

  /**
   * Ambil detail KPLT berdasarkan ID.
   */
  const { data, isLoading, isError, error, mutate, rawData } =
    useKpltDetail(kpltId);

  /**
   * Utility fetch: POST approval dari RM/BM.
   */
  const fetchApprovalPost = async (id: string, is_approved: boolean) => {
    const res = await fetch(`/api/kplt/${id}/approvals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_approved }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || "Gagal mengirim status approval");
    }
    return result.data;
  };

  /**
   * Utility fetch: PATCH status final oleh GM.
   */
  const fetchStatusPatch = async (id: string, newStatus: "OK" | "NOK") => {
    const res = await fetch(`/api/kplt/${id}/approvals`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kplt_approval: newStatus }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || "Gagal memperbarui status");
    }
    return result.data;
  };

  /**
   * Handler untuk aksi approval:
   * - General Manager → PATCH status final
   * - BM/RM → POST approval
   */
  const handleApprovalClick = async (status: "OK" | "NOK") => {
    if (!kpltId || !user?.position_nama) return;

    const position = user.position_nama.toLowerCase();

    // Konfirmasi sebelum melanjutkan
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
        // GM langsung mengubah status final KPLT
        await fetchStatusPatch(kpltId, status);
        showToast({
          type: "success",
          message: `Status KPLT berhasil diubah menjadi ${status}!`,
        });
      } else {
        // RM/BM mengirim approval bertingkat
        const isApproved = status === "OK";
        await fetchApprovalPost(kpltId, isApproved);
        showToast({
          type: "success",
          message: "Status approval berhasil dikirim!",
        });
      }

      // Redirect dan refresh data SWR
      router.push("/form_kplt");
      invalidate.kplt();
    } catch (err: any) {
      console.error("Proses approval/set status gagal:", err);
      showToast({ type: "error", message: err.message || "Terjadi kesalahan" });
    } finally {
      setIsApproving(false);
    }
  };

  /**
   * Handler submit untuk file Intip.
   */
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
        invalidate.kplt();
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

  /**
   * Handler submit Form Ukur.
   */
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
        invalidate.kplt();
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

  /**
   * Menentukan apakah user boleh melakukan approval
   * dan apakah approval-nya sudah pernah dilakukan.
   */
  const { isAlreadyApproved, showApprovalSection } = useMemo(() => {
    if (!data || !user?.position_nama) {
      return { isAlreadyApproved: false, showApprovalSection: false };
    }

    const position = user.position_nama.toLowerCase();
    const mainStatus = data.base.kpltapproval;
    const summary = data.approvalsSummary;

    // GM hanya bisa approve jika status "Waiting for Forum"
    if (position === "general manager") {
      const show = mainStatus === "Waiting for Forum";
      return {
        isAlreadyApproved: mainStatus === "OK" || mainStatus === "NOK",
        showApprovalSection: show,
      };
    }

    // Branch Manager
    if (position === "branch manager") {
      const already = !!summary?.bm;
      const show = mainStatus === "In Progress" && !already;
      return {
        isAlreadyApproved: already,
        showApprovalSection: show,
      };
    }

    // Regional Manager
    if (position === "regional manager") {
      const already = !!summary?.rm;
      const show = mainStatus === "In Progress" && !already;
      return {
        isAlreadyApproved: already,
        showApprovalSection: show,
      };
    }

    return { isAlreadyApproved: false, showApprovalSection: false };
  }, [data, user]);

  /**
   * Render layout detail KPLT beserta semua handler & state.
   */
  return (
    <DetailKpltLayout
      id={kpltId!}
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
