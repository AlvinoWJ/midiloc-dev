"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import DetailKpltLayout from "@/components/desktop/detail-kplt-layout";
import { useKpltDetail } from "@/hooks/useKpltDetail";
import { useAlert } from "@/components/desktop/alertcontext";
import { useUser } from "@/hooks/useUser";

const PageStatus = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <p className="text-xl text-gray-600">{message}</p>
  </div>
);

export default function DetailKpltPage() {
  const params = useParams<{ id: string }>();
  const kpltId = params?.id;

  const { showToast } = useAlert();
  const { user } = useUser();
  const [isApproving, setIsApproving] = useState(false);
  const { data, isLoading, isError, error, mutate } = useKpltDetail(kpltId);

  // Fungsi untuk mengirim approval BM/RM (POST)
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

  // Handler utama yang sudah disederhanakan
  const handleApprove = async (status: "OK" | "NOK") => {
    if (!kpltId) return;
    setIsApproving(true);
    try {
      await fetchApprovalPost(kpltId, status === "OK");
      showToast({
        type: "success",
        message: "Status approval berhasil dikirim!",
      });
      await mutate();
    } catch (err: any) {
      console.error("Proses approval gagal:", err);
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
    let userHasApproved = false;
    if (position === "branch manager" && data.approvalsSummary?.bm) {
      userHasApproved = true;
    } else if (position === "regional manager" && data.approvalsSummary?.rm) {
      userHasApproved = true;
    }
    const shouldShowSection = data.base.kpltapproval === "In Progress";

    return {
      isAlreadyApproved: userHasApproved,
      showApprovalSection: shouldShowSection,
    };
  }, [data, user]);

  if (isLoading) return <PageStatus message="Memuat detail KPLT..." />;
  if (isError)
    return <PageStatus message={`Gagal memuat data: ${error?.message}`} />;
  if (!data) return <PageStatus message="Data KPLT tidak ditemukan." />;

  return (
    <DetailKpltLayout
      data={data}
      isApproving={isApproving}
      onApprove={handleApprove}
      isAlreadyApproved={isAlreadyApproved}
      showApprovalSection={showApprovalSection}
    />
  );
}
