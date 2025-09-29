"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { useTambahKplt } from "@/hooks/useTambahkplt"; // Hook form kita
import TambahKpltLayout from "@/components/desktop/tambah-kplt-layout"; // Komponen UI
import { mapKpltRowToMappedData } from "@/hooks/useKpltDetail";
import SWRProvider from "@/app/swr-provider";
import { useAlert } from "@/components/desktop/alertcontext"; // Untuk notifikasi
import { PrefillKpltResponse } from "@/types/common";
import { KpltCreatePayload } from "@/lib/validations/kplt";

// Wrapper tidak perlu diubah, sudah benar
export default function TambahkpltPageWrapper() {
  return (
    <SWRProvider>
      <TambahKpltPage />
    </SWRProvider>
  );
}

// Komponen helper untuk menampilkan status halaman
const PageStatus = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <p className="text-xl text-gray-600">{message}</p>
  </div>
);

// Fetcher untuk SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Gagal memuat data.");
  }
  return res.json();
};

function TambahKpltPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useAlert();
  const ulokId = params?.id || "";

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. FETCH DATA PREFILL (Hanya untuk ditampilkan di atas form)
  const {
    data: prefillApiResponse,
    error: prefillError,
    isLoading: isPrefillLoading,
  } = useSWR<PrefillKpltResponse>(
    ulokId ? `/api/ulok/${ulokId}/kplt/prefill` : null,
    fetcher
  );

  // 2. MAPPING DATA PREFILL
  const mappedPrefillData = useMemo(
    () =>
      prefillApiResponse?.base
        ? mapKpltRowToMappedData(prefillApiResponse)
        : undefined,
    [prefillApiResponse]
  );

  // 3. Setup hook form
  const { formData, errors, handleChange, handleFileChange, handleFormSubmit } =
    useTambahKplt({
      onSubmit: async (data: KpltCreatePayload) => {
        try {
          setIsSubmitting(true);

          // Bungkus data ke FormData untuk upload file
          const formPayload = new FormData();
          Object.entries(data).forEach(([key, value]) => {
            if (value instanceof File) {
              formPayload.append(key, value);
            } else if (value !== null && value !== undefined) {
              formPayload.append(key, String(value));
            }
          });

          const res = await fetch(`/api/ulok/${ulokId}/kplt`, {
            method: "POST",
            body: formPayload,
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Gagal menyimpan data.");
          }

          showToast({
            type: "success",
            title: "Berhasil",
            message: "Data KPLT berhasil disimpan.",
          });

          router.push(`/ulok/${ulokId}/kplt`);
        } catch (err) {
          showToast({
            type: "error",
            title: "Gagal",
            message:
              err instanceof Error ? err.message : "Terjadi kesalahan server.",
          });
        } finally {
          setIsSubmitting(false);
        }
      },
      isSubmitting,
      initialData: prefillApiResponse ?? null,
    });

  // 4. Handle loading & error
  if (isPrefillLoading) return <PageStatus message="Memuat data..." />;
  if (prefillError) return <PageStatus message="Gagal memuat data prefill." />;

  // 5. Render layout
  return (
    <TambahKpltLayout
      prefillData={mappedPrefillData}
      formData={formData}
      errors={errors}
      isSubmitting={isSubmitting}
      handleChange={handleChange}
      handleFileChange={handleFileChange}
      handleFormSubmit={handleFormSubmit}
    />
  );
}
