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
        // Jika API mengembalikan error, tampilkan pesannya
        throw new Error(
          resJson.error || "Terjadi kesalahan saat menyimpan data."
        );
      }

      showToast({
        type: "success",
        title: "Berhasil",
        message: "Usulan Lokasi baru telah berhasil disimpan!",
      });
      router.push("/usulan_lokasi");
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

  // --- RENDER LOGIC ---

  // 1. Tampilkan skeleton saat deteksi perangkat sedang berjalan
  // Ini penting untuk mencegah "flicker" atau tampilan layout yang salah sesaat.

  // 2. Siapkan props yang akan diteruskan ke komponen UI
  const formProps = {
    onSubmit: handleFormSubmit,
    isSubmitting: isSubmitting,
  };

  // 3. Render komponen yang sesuai berdasarkan hasil deteksi perangkat
  return <TambahUlokForm {...formProps} />;
}
