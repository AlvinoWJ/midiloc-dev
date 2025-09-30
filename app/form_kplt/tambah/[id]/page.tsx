"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTambahKplt } from "@/hooks/useTambahkplt"; // Hook form kita
import TambahKpltLayout from "@/components/desktop/tambah-kplt-layout"; // Komponen UI
import SWRProvider from "@/app/swr-provider";
import { useAlert } from "@/components/desktop/alertcontext"; // Untuk notifikasi
import { useKpltPrefill } from "@/hooks/useKpltPrefill";
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

function TambahKpltPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useAlert();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ulokId = params?.id;

  if (!ulokId) {
    return <PageStatus message="ID ULOK tidak ditemukan di URL." />;
  }

  const {
    data: mappedPrefillData, // Ini data yang sudah bersih
    rawData: prefillApiResponse, // Ini data mentah untuk form
    isLoading: isPrefillLoading,
    error: prefillError,
  } = useKpltPrefill(ulokId);

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
