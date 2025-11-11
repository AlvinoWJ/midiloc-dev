"use client";

import React from "react";
import { useParams } from "next/navigation";
import DetailProgressKpltLayout from "@/components/layout/detail_progress_kplt_layout";
import { useProgressDetail } from "@/hooks/progress_kplt/useProgressDetail";
import { useModuleFiles } from "@/hooks/useModuleFile";
import { Loader2 } from "lucide-react";

export default function DetailProgressKpltPage() {
  const params = useParams();
  const progressId = params.id as string;

  const {
    progressDetail: progressData,
    isLoading: isProgressLoading,
    isError: isProgressError,
  } = useProgressDetail(progressId);

  const kpltId = progressData?.kplt_id?.id;

  const {
    files,
    isLoading: isFilesLoading,
    error: isFilesError,
  } = useModuleFiles("kplt", kpltId);

  const isPageLoading = isProgressLoading || (kpltId && isFilesLoading);

  if (isProgressLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <p className="mt-4 text-gray-600">Memuat Detail Progres KPLT...</p>
      </div>
    );
  }

  if (isProgressError || isFilesError || !progressData) {
    return (
      <main className="p-4 lg:p-6 text-center">
        <p className="text-red-600">
          Gagal memuat data.
          {isProgressError || isFilesError?.message}
        </p>
      </main>
    );
  }

  return (
    <DetailProgressKpltLayout
      progressData={progressData}
      files={files}
      isFilesError={isFilesError}
    />
  );
}
