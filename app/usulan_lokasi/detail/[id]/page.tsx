"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";
import DetailUlok from "@/components/detailulok";
import { useSidebar } from "@/components/ui/sidebarcontext";
import { UlokUpdateInput } from "@/lib/validations/ulok";
import InputIntipForm from "@/components/inputintip";
import { useAlert } from "@/components/alertcontext";
import { DetailUlokSkeleton } from "@/components/skleton";

interface UlokDataForUI {
  id: string;
  namaUlok: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  kelurahan: string;
  alamat: string;
  latlong: string;
  tanggalUlok: string;
  formatStore: string;
  bentukObjek: string;
  alasHak: string;
  jumlahlantai: string;
  lebardepan: string;
  panjang: string;
  luas: string;
  hargasewa: string;
  namapemilik: string;
  kontakpemilik: string;
  approval_status: string;
  approval_intip: string;
  tanggal_approval_intip: string;
  file_intip: string | null;
}

interface IntipFormData {
  approval_intip: string;
  tanggal_approval_intip: string;
  file_intip: File | null;
  approval_status: string;
}

type CurrentUser = {
  id: string;
  nama: string;
  position_nama: string;
};

export default function DetailPage() {
  const { isCollapsed } = useSidebar();
  const { id } = useParams<{ id: string }>();

  const [ulokData, setUlokData] = useState<UlokDataForUI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showIntipForm, setShowIntipForm] = useState(false);
  const [isSubmittingIntip, setIsSubmittingIntip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const { showToast, showConfirmation } = useAlert();

  const [fileIntipUrl, setFileIntipUrl] = useState<string | null>(null);

  // --- Fetch data user ---
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/me");
        if (!response.ok) throw new Error("Gagal mendapatkan data user");
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error("Fetch user error:", error);
        setErrorMessage("Tidak dapat memuat sesi pengguna.");
      }
    };
    fetchCurrentUser();
  }, []);

  // --- Fetch data ulok ---
  const fetchData = useCallback(async () => {
    if (!id) {
      setIsLoading(true);
      setErrorMessage("ID tidak ditemukan di URL.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/ulok/${id}`);
      if (!response.ok)
        throw new Error(`Gagal ambil data (${response.status})`);

      const jsonResponse = await response.json();
      const apiData = jsonResponse.data?.[0];

      if (!apiData) throw new Error("Data tidak ditemukan.");

      setUlokData({
        id: apiData.id,
        namaUlok: apiData.nama_ulok,
        provinsi: apiData.provinsi,
        kabupaten: apiData.kabupaten,
        kecamatan: apiData.kecamatan,
        kelurahan: apiData.desa_kelurahan,
        alamat: apiData.alamat,
        latlong: `${apiData.latitude}, ${apiData.longitude}`,
        tanggalUlok: apiData.created_at,
        formatStore: apiData.format_store,
        bentukObjek: apiData.bentuk_objek,
        alasHak: String(apiData.alas_hak),
        jumlahlantai: String(apiData.jumlah_lantai),
        lebardepan: String(apiData.lebar_depan),
        panjang: String(apiData.panjang),
        luas: String(apiData.luas),
        hargasewa: `Rp ${new Intl.NumberFormat("id-ID").format(
          apiData.harga_sewa
        )}`,
        namapemilik: apiData.nama_pemilik,
        kontakpemilik: apiData.kontak_pemilik,
        approval_status: apiData.approval_status,
        file_intip: apiData.file_intip,
        approval_intip: apiData.approval_intip,
        tanggal_approval_intip: apiData.tanggal_approval_intip,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- [BARU] useEffect untuk mengambil file intip SETELAH data ulok didapat ---
  useEffect(() => {
    // Pastikan ada data ulok dan ada path file_intip
    if (!ulokData || !ulokData.file_intip) {
      return;
    }

    const fetchFile = async () => {
      try {
        // Fetch ke endpoint file Anda
        const response = await fetch(`/api/ulok/${ulokData.id}/file-intip`);

        if (!response.ok) {
          throw new Error("Gagal mengambil file intip.");
        }

        // Konversi respons menjadi Blob (binary large object)
        const fileBlob = await response.blob();

        // Buat URL sementara dari Blob agar bisa ditampilkan di browser
        const objectUrl = URL.createObjectURL(fileBlob);
        setFileIntipUrl(objectUrl);
      } catch (error) {
        console.error("Fetch file error:", error);
        // Anda bisa set state error di sini jika perlu
      }
    };

    fetchFile();

    // Cleanup function untuk menghapus object URL dari memori saat komponen di-unmount
    return () => {
      if (fileIntipUrl) {
        URL.revokeObjectURL(fileIntipUrl);
      }
    };
  }, [ulokData]); // Dijalankan setiap kali ulokData berubah

  // --- Save/Edit ---
  const handleSaveData = async (data: UlokUpdateInput): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      await fetch(`http://localhost:3000/api/ulok/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      alert("Data berhasil diperbarui!");
      await fetchData();
      return true;
    } catch (error) {
      alert("Gagal menyimpan pembaruan.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Submit Intip ---
  const handleIntipSubmit = async (formData: FormData) => {
    setIsSubmittingIntip(true);
    try {
      const response = await fetch(`http://localhost:3000/api/ulok/${id}`, {
        method: "PATCH",
        body: formData,
      });
      if (!response.ok) throw new Error("Gagal menyimpan data intip.");
      fetchData();
    } catch (error: any) {
    } finally {
      setIsSubmittingIntip(false);
    }
  };

  // Approve (LM multipart)
  const handleSetApproval = async (status: "OK" | "NOK") => {
    if (!id) return;

    const confirmed = await showConfirmation({
      title: "Konfirmasi Perubahan Status",
      message:
        status === "OK"
          ? `Apakah Anda yakin ingin menyetujui ${ulokData?.namaUlok}?`
          : `Apakah Anda yakin ingin menolak ${ulokData?.namaUlok}?`,
      confirmText: status === "OK" ? "Ya, Setujui" : "Ya, Tolak",
      cancelText: "Batal",
      type: status === "OK" ? "success" : "error",
    });

    if (!confirmed) return;

    setIsApproving(true);
    try {
      const fd = new FormData();
      fd.append("approval_status", status);
      const res = await fetch(`/api/ulok/${id}`, {
        method: "PATCH",
        body: fd,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal update status.");
      }
      showToast({
        type: "success",
        title: "Status Berhasil Diubah",
        message: `Approval status telah diubah menjadi ${status}`,
        duration: 4000,
      });

      await fetchData();
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Gagal Mengubah Status",
        message: e.message || "Terjadi kesalahan saat mengupdate status",
        duration: 6000,
      });
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col bg-gray-50 min-h-screen transition-all duration-300 ${
          isCollapsed ? "pl-[80px]" : "pl-[270px]"
        }`}
      >
        <Navbar />
        <main className="flex-1 p-4 md:p-6 hide-scrollbar">
          {isLoading && <DetailUlokSkeleton />}
          {errorMessage && (
            <p className="text-center text-red-500 py-10">{errorMessage}</p>
          )}
          {ulokData && !isLoading && (
            <DetailUlok
              initialData={ulokData}
              onSave={handleSaveData}
              isSubmitting={isSubmitting}
              user={user}
              onOpenIntipForm={() => setShowIntipForm(true)}
              fileIntipUrl={fileIntipUrl}
              onApprove={handleSetApproval}
            />
          )}
        </main>

        {/* Modal Input Intip */}
        {showIntipForm && (
          <InputIntipForm
            onClose={() => setShowIntipForm(false)}
            onSubmit={handleIntipSubmit}
            isSubmitting={isSubmittingIntip}
          />
        )}
      </div>
    </div>
  );
}
