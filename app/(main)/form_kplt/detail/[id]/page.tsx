"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import DetailKpltLayout from "@/components/detail_kplt_layout";
import { useKpltDetail } from "@/hooks/useKpltDetail";
import { useAlert } from "@/components/shared/alertcontext";
import { useUser } from "@/hooks/useUser";

export default function DetailKpltPage() {
  const params = useParams<{ id: string }>();
  const kpltId = params?.id;

  const { showToast } = useAlert();
  const { user } = useUser();
  const [isApproving, setIsApproving] = useState(false);
  const { data, isLoading, isError, error, mutate } = useKpltDetail(kpltId);

  // approval BM/RM (POST)
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

  // approval GM (PATCH)
  const fetchStatusPatch = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/kplt/${id}/approvals`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approval_status: newStatus }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || "Gagal memperbarui status");
    }
    return result.data;
  };

  const handleApprovalClick = async (status: "OK" | "NOK") => {
    if (!kpltId || !user?.position_nama) return;

    const position = user.position_nama.toLowerCase();
    setIsApproving(true);

    try {
      if (position === "general manager") {
        await fetchStatusPatch(kpltId, status);
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
      showToast({ type: "error", message: err.message });
    } finally {
      setIsApproving(false);
    }
  };

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
        isAlreadyApproved: !show,
        showApprovalSection: show,
      };
    }

    if (position === "branch manager") {
      const alreadyApproved = !!summary?.bm;
      const show = mainStatus === "In Progress" && !alreadyApproved;
      return {
        isAlreadyApproved: alreadyApproved,
        showApprovalSection: show,
      };
    }

    if (position === "regional manager") {
      const alreadyApproved = !!summary?.rm;
      const show = mainStatus === "In Progress" && !alreadyApproved;
      return {
        isAlreadyApproved: alreadyApproved,
        showApprovalSection: show,
      };
    }
    return { isAlreadyApproved: false, showApprovalSection: false };
  }, [data, user]);

  return (
    <DetailKpltLayout
      id={kpltId}
      data={data}
      isApproving={isApproving}
      isLoading={isLoading} // <-- TAMBAHKAN INI
      isError={isError} // <-- TAMBAHKAN INI
      onApprove={handleApprovalClick}
      isAlreadyApproved={isAlreadyApproved}
      showApprovalSection={showApprovalSection}
    />
  );
}
