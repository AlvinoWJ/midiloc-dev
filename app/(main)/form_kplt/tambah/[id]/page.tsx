"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTambahKplt, KpltFormData } from "@/hooks/kplt/useTambahkplt";
import TambahKpltLayout from "@/components/layout/tambah_kplt_layout";
import { useAlert } from "@/components/shared/alertcontext";
import { useKpltPrefill } from "@/hooks/kplt/useKpltPrefill";
import { useSWRConfig } from "swr";
import { invalidate } from "@/lib/swr-invalidate";
import DetailKpltSkeleton from "@/components/ui/skleton";

/**
 * Komponen untuk menampilkan pesan status pada layar penuh.
 * Digunakan untuk error message atau invalid params.
 */
const PageStatus = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <p className="text-xl text-gray-600">{message}</p>
  </div>
);

export default function TambahKpltPage() {
  // Ambil parameter dynamic route, yaitu ID ULOK
  const params = useParams<{ id: string }>();
  const ulokId = params?.id;

  // Router untuk navigasi setelah submit data
  const router = useRouter();

  // Toast/alert handler
  const { showToast } = useAlert();

  // Untuk men-disable button ketika proses submit sedang berlangsung
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SWR mutate digunakan untuk invalidasi cache
  const { mutate } = useSWRConfig();

  // Jika ID ULOK tidak ditemukan di URL → tampilkan pesan error
  if (!ulokId) {
    return <PageStatus message="ID ULOK tidak ditemukan di URL." />;
  }

  /**
   * Ambil data prefill berdasarkan ulokId.
   * - mappedPrefillData → data yang sudah dibersihkan untuk layout
   * - prefillApiResponse → data mentah yang digunakan sebagai initial form values
   */
  const {
    data: mappedPrefillData,
    rawData: prefillApiResponse,
    isLoading: isPrefillLoading,
    error: prefillError,
  } = useKpltPrefill(ulokId);

  /**
   * Setup form menggunakan custom hook:
   * - formData → state semua input
   * - errors → error validasi
   * - handleChange → event handler untuk input teks
   * - handleFileChange → event handler untuk upload file
   * - handleFormSubmit → handle untuk submit form
   *
   * onSubmit → callback ketika form berhasil tervalidasi
   */
  const { formData, errors, handleChange, handleFileChange, handleFormSubmit } =
    useTambahKplt({
      onSubmit: async (data: KpltFormData) => {
        try {
          setIsSubmitting(true);

          /**
           * Buat FormData agar bisa mengirim data sekaligus file (multipart/form-data).
           */
          const formPayload = new FormData();
          formPayload.append("ulok_id", ulokId);

          // Masukkan seluruh field form ke dalam FormData
          Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              if (value instanceof File) {
                formPayload.append(key, value); // Jika file → kirim sebagai file
              } else {
                formPayload.append(key, String(value)); // Jika bukan file → kirim string
              }
            }
          });

          /**
           * Kirim data ke API route /api/kplt
           */
          const res = await fetch(`/api/kplt`, {
            method: "POST",
            body: formPayload,
          });

          // Jika request gagal → tampilkan error dari backend
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Gagal menyimpan data.");
          }

          // Tampilkan toast sukses
          showToast({
            type: "success",
            title: "Berhasil",
            message: "Data KPLT berhasil disimpan.",
          });

          // Invalidasi semua data KPLT di SWR agar data terbaru muncul
          await invalidate.kplt();

          // Kembali ke halaman sebelumnya
          router.back();

          // Force refresh agar data sinkron
          router.refresh();
        } catch (err) {
          // Error handling submit
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

      // To disable form while submitting
      isSubmitting,

      // Prefill initial form values jika prefill tersedia
      initialData: prefillApiResponse ?? null,
    });

  /**
   * Loading state: tampilkan skeleton UI
   */
  if (isPrefillLoading) {
    return <DetailKpltSkeleton />;
  }

  /**
   * Error state ketika prefill gagal
   */
  if (prefillError) {
    return <PageStatus message="Gagal memuat data prefill." />;
  }

  /**
   * Render layout utama dengan semua props terkait form.
   */
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
