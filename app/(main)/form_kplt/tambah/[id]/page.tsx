"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTambahKplt, KpltFormData } from "@/hooks/useTambahkplt"; // Hook form kita
import TambahKpltLayout from "@/components/tambah_kplt_layout"; // Komponen UI
import { useAlert } from "@/components/shared/alertcontext"; // Untuk notifikasi
import { useKpltPrefill } from "@/hooks/useKpltPrefill";
import { KpltCreatePayload } from "@/lib/validations/kplt";

// Komponen helper untuk menampilkan status halaman
const PageStatus = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <p className="text-xl text-gray-600">{message}</p>
  </div>
);

export default function TambahKpltPage() {
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
      onSubmit: async (data: KpltFormData) => {
        try {
          setIsSubmitting(true);

          const formPayload = new FormData();
          formPayload.append("ulok_id", ulokId);

          Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              if (value instanceof File) {
                formPayload.append(key, value);
              } else {
                formPayload.append(key, String(value));
              }
            }
          });
          const res = await fetch(`/api/kplt`, {
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

          router.push(`/form_kplt`);
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
