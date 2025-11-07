"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import DetailProgressKpltLayout from "@/components/layout/detail_progress_kplt_layout";
import { useProgressDetail } from "@/hooks/progress_kplt/useProgressDetail";
import { Loader2 } from "lucide-react";
import { useKpltFiles } from "@/hooks/useKpltfile";

export default function DetailProgressKpltPage() {
  const params = useParams();
  const id = params.id as string;
  const [showError, setShowError] = useState(false);

  const { progressDetail, isLoading, isError } = useProgressDetail(id);

  useEffect(() => {
    if (isError) {
      const timer = setTimeout(() => setShowError(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // 8. Tampilkan status error
  if (isError || !progressDetail) {
    return (
      <div className="text-red-500 text-center p-8">
        Gagal memuat data progress KPLT.
      </div>
    );
  }

  return <DetailProgressKpltLayout progressData={progressDetail} />;
}
