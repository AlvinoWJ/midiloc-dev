"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UlokCreateInput } from "@/lib/validations/ulok";
import { useAlert } from "@/components/shared/alertcontext";
import { invalidate } from "@/lib/swr-invalidate";
import TambahUlokForm from "@/components/layout/tambah_ulok_layout";

export default function TambahUlokPage() {
  const router = useRouter();
  const { showToast } = useAlert();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (data: UlokCreateInput) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const response = await fetch("/api/ulok", {
        method: "POST",
        body: formData,
      });
      invalidate.ulok();

      const resJson = await response.json();

      if (!response.ok) {
        throw new Error(
          resJson.error || "Terjadi kesalahan saat menyimpan data."
        );
      }

      showToast({
        type: "success",
        title: "Berhasil",
        message: "Usulan Lokasi baru telah berhasil disimpan!",
      });
      router.back();
    } catch (err: unknown) {
      showToast({
        type: "error",
        title: "Gagal Menyimpan",
        message:
          err instanceof Error
            ? err.message
            : "Gagal menghubungi server. Coba lagi nanti.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const formProps = {
    onSubmit: handleFormSubmit,
    isSubmitting: isSubmitting,
  };

  return <TambahUlokForm {...formProps} />;
}
