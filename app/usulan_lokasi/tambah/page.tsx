"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebarcontext";
import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";
import TambahUlokForm from "@/components/addulokform";
import { UlokCreateInput } from "@/lib/validations/ulok";
import { useAlert } from "@/components/alertcontext";

export default function TambahUlokPage() {
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useAlert();

  // --- (BARU) Fungsi "pintar" untuk menangani fetch API ---
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
        showToast({
          type: "error",
          message: resJson.error || "Terjadi kesalahan saat menyimpan data.",
        });
      } else {
        showToast({
          type: "success",
          message: "Data berhasil disimpan!",
        });
        router.push("/usulan_lokasi");
      }
    } catch (err) {
      showToast({
        type: "error",
        message: "Gagal menghubungi server. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col bg-gray-50 min-h-screen transition-all duration-300 ${
          isCollapsed ? "ml-[80px]" : "ml-[270px]"
        }`}
      >
        <Navbar />
        <main className="flex-1 p-6 mt-3">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">
            Tambah Usulan Lokasi Baru
          </h1>

          {/* Komponen form sekarang menerima props */}
          <TambahUlokForm
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        </main>
      </div>
    </div>
  );
}
