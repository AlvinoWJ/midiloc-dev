"use client";

import { useParams } from "next/navigation";
import { useUlokEksternalDetail } from "@/hooks/ulok_eksternal/useUlokEksternalDetail";
import DetailUlokEksternalLayout from "@/components/layout/detail_ulok_eksternal_layout";

export default function DetailUlokEksternalPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  // 1. Panggil hook dengan ID dari URL
  const { ulokEksternalDetail, isLoading, isError } =
    useUlokEksternalDetail(id);

  // 2. Tampilkan layout dengan data dari hook
  return (
    <DetailUlokEksternalLayout
      ulok={ulokEksternalDetail ?? null}
      isLoading={isLoading}
      isError={!!isError}
    />
  );
}
