"use client";

import { useParams } from "next/navigation";
import DetailTokoExistingLayout from "@/components/layout/detail_toko_existing_layout";
import { useTokoExistingDetail } from "@/hooks/toko_existing/useTokoExistingDetail";

export default function DetailTokoExistingPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { tokoDetail, isLoading, isError } = useTokoExistingDetail(id);

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center text-red-500">
        Terjadi kesalahan saat memuat data Toko Existing.
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <DetailTokoExistingLayout isLoading={isLoading} data={tokoDetail} />
    </div>
  );
}
