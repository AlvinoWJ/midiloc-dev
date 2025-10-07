"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UlokCreateInput } from "@/lib/validations/ulok";
import { useAlert } from "@/components/desktop/alertcontext";
import AddUlokFormDesktop from "@/components/desktop/tambah-ulok-layout"; // Pastikan path dan nama file sesuai
import AddUlokFormMobile from "@/components/mobile/add-ulok-layout"; // Pastikan path dan nama file sesuai

export default function TambahUlokPage() {
  // --- HOOKS ---
  const router = useRouter();
  const { showToast } = useAlert();

  // --- STATE MANAGEMENT ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- API HANDLER ---
  // Logika ini menjadi "otak" halaman, yang akan di-pass ke komponen UI.
  const handleFormSubmit = async (data: UlokCreateInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/ulok", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const resJson = await response.json();

      if (!response.ok) {
        // Jika API mengembalikan error, tampilkan pesannya
        throw new Error(
          resJson.error || "Terjadi kesalahan saat menyimpan data."
        );
      }

      // Jika berhasil
      showToast({
        type: "success",
        title: "Berhasil",
        message: "Usulan Lokasi baru telah berhasil disimpan!",
      });
      router.push("/usulan_lokasi"); // Arahkan ke halaman daftar
    } catch (err: unknown) {
      // Tangani semua jenis error (network, API, etc.)
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
  return <AddUlokFormDesktop {...formProps} />;
}
