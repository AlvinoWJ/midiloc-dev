"use client";

import React, { useState, ChangeEvent } from "react";
import {
  Upload,
  FileText,
  Calendar,
  CheckCircle2,
  X,
  Eye,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/shared/alertcontext";

interface InputFormUkurProps {
  onSubmit: (formData: FormData) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

interface DetailFieldProps {
  label: string;
  value: string | File | null;
  name: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onRemove?: () => void;
  onPreview?: () => void;
  previewUrl?: string | null;
  type?: string;
  options?: string[];
}

const DetailField = ({
  label,
  value,
  name,
  onChange,
  onRemove,
  onPreview,
  type = "text",
}: DetailFieldProps) => {
  if (type === "file") {
    const fileValue = value as File | null;
    return (
      <div className="col-span-2">
        <label className="block text-base font-semibold text-gray-700 mb-3">
          {label} <span className="text-red-500">*</span>
        </label>
        {/* Kontainer dropzone utama */}
        <div
          className="group border-2 border-dashed border-gray-300 rounded-xl p-8 lg:p-10 text-center hover:border-red-400 transition-all duration-300 cursor-pointer relative"
          onClick={() => !fileValue && document.getElementById(name)?.click()}
        >
          <input
            id={name}
            name={name}
            type="file"
            className="hidden"
            onChange={onChange}
            accept=".pdf"
          />

          {fileValue ? (
            // --- TAMPILAN SETELAH FILE DIUNGGAH (Gambar 2 & 3) ---
            <div className="relative text-center z-10 animate-in fade-in slide-in-from-top-2 duration-500">
              {/* Wrapper div untuk positioning tombol X */}
              <div className="relative inline-block mb-3">
                {/* Grup untuk "Buka PDF" dan Ikon (untuk hover effect) */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview?.(); // Membuka file di tab baru
                  }}
                  // 2. Isolasi hover group inner
                  className="inline-flex flex-col items-center justify-center group/inner cursor-pointer select-none"
                >
                  <FileText className="w-10 h-10 text-gray-700 group-hover/inner:text-red-500 transition-colors duration-300" />
                  <p className="mt-2 text-sm font-semibold text-gray-700 group-hover/inner:text-red-500 transition-colors duration-300">
                    Buka PDF
                  </p>
                </div>

                {/* Tombol Hapus (X) - SEKARANG SIBLING, bukan child */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove?.();
                  }}
                  className="absolute -top-2 -right-4 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 z-20"
                  aria-label="Hapus file"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Nama file */}
              <p className="text-sm font-medium text-gray-700 mb-2 break-words px-4">
                {fileValue?.name}
              </p>

              {/* Tombol "Ganti file" */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById(name)?.click();
                }}
                // 1. Ganti file tanpa underline, hover underline
                className="text-blue-600 hover:text-blue-700 text-sm font-medium no-underline hover:underline transition-all duration-200"
              >
                Ganti file
              </button>
            </div>
          ) : (
            // --- TAMPILAN KOSONG (Gambar 1) ---
            <div className="text-center relative z-10">
              {/* Ikon Upload */}
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center text-red-500 transition-all duration-300 group-hover:bg-red-200">
                <Upload className="w-8 h-8" />
              </div>
              {/* Teks Petunjuk */}
              <p className="text-base font-semibold text-gray-700 mb-1 group-hover:text-red-600 transition-colors">
                Klik untuk mengupload file
              </p>
              <p className="text-sm text-gray-500">PDF (Maks 15 MB)</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Kode untuk field TANGGAL (Tidak diubah) ---
  if (type === "date") {
    return (
      <div>
        <label className="block text-base font-semibold text-gray-700 mb-3">
          {label} <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <input
            type={type}
            value={String(value || "")}
            onChange={onChange}
            name={name}
            className="w-full px-4 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-0 focus:border-red-500 hover:border-red-500 text-gray-700 font-medium bg-white shadow-sm"
          />
        </div>
      </div>
    );
  }

  // --- Kode untuk field TEXT (Tidak diubah) ---
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type={type}
          value={String(value || "")}
          onChange={onChange}
          name={name}
          className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-0 focus:border-red-400 hover:border-gray-300 transition-all duration-200 text-gray-700 font-medium bg-white shadow-sm"
        />
      </div>
    </div>
  );
};

// --- KOMPONEN UTAMA (Tidak diubah) ---
export default function InputFormUkur({
  onSubmit,
  onClose,
  isSubmitting,
}: InputFormUkurProps) {
  const { showAlert, showConfirmation } = useAlert();
  const [formData, setFormData] = useState<{
    tanggal_ukur: string;
    form_ukur: File | null;
  }>({
    tanggal_ukur: "",
    form_ukur: null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // State showPreview sekarang dikontrol oleh onPreview
  // const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, files } = event.target as HTMLInputElement;
    if (files) {
      console.log("File yang dipilih:", files[0]);
      const file = files[0];
      // Hapus preview URL lama jika ada
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      // Buat preview URL baru
      if (file) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, form_ukur: null }));
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    // Reset file input
    const fileInput = document.getElementById("form_ukur") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  // Fungsi ini sekarang akan membuka file di tab baru
  const handlePreviewFile = () => {
    if (previewUrl) {
      window.open(previewUrl, "_blank");
      // setShowPreview(true); // Tidak perlu modal lagi
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log("State formData sebelum submit:", formData);

    if (!formData.tanggal_ukur || !formData.form_ukur) {
      showAlert({
        type: "error",
        title: "Gagal Menyimpan",
        message: "Semua field wajib diisi.",
        duration: 5000,
      });
      return;
    }

    if (formData.form_ukur && formData.form_ukur.size > 15 * 1024 * 1024) {
      showAlert({
        type: "error",
        title: "File Terlalu Besar",
        message:
          "Ukuran file maksimal 15MB. Silakan pilih file yang lebih kecil.",
        duration: 5000,
      });
      return;
    }

    const confirmed = await showConfirmation({
      title: "Konfirmasi Submit Form Ukur",
      message: `Apakah Anda yakin ingin menyimpan data Form Ukur dengan tanggal "${formData.tanggal_ukur}"? Pastikan semua data sudah benar.`,
      confirmText: "Ya, Simpan Data",
      cancelText: "Periksa Kembali",
      type: "success",
    });

    if (!confirmed) return;

    try {
      const dataToSend = new FormData();
      dataToSend.append("tanggal_ukur", formData.tanggal_ukur);
      if (formData.form_ukur) {
        dataToSend.append("form_ukur", formData.form_ukur);
      }

      console.log("--- Mengecek isi FormData ---");
      for (let pair of dataToSend.entries()) {
        console.log(pair[0] + ": ", pair[1]);
      }
      console.log("----------------------------");

      await onSubmit(dataToSend);

      // Cleanup preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      onClose();
    } catch (error) {
      console.error("Error submitting Form Ukur data:", error);

      showAlert({
        type: "error",
        title: "Terjadi Kesalahan",
        message:
          "Gagal menyimpan data Form Ukur. Silakan periksa koneksi internet Anda dan coba lagi.",
        duration: 6000,
      });
    }
  };

  const handleCancel = async () => {
    const hasUnsavedChanges = formData.tanggal_ukur || formData.form_ukur;

    if (hasUnsavedChanges) {
      const confirmed = await showConfirmation({
        title: "Batalkan Perubahan?",
        message:
          "Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin menutup form ini?",
        confirmText: "Ya, Tutup",
        cancelText: "Lanjutkan Mengisi",
        type: "warning",
      });

      if (confirmed) {
        // Cleanup preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <>
      {/* --- FORM MODAL (Tidak diubah) --- */}
      <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        >
          {/* Header */}
          <div className="relative border-b border-gray-300 bg-gradient-to-r from-red-50 via-white to-red-50 px-6 py-5">
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] opacity-20"></div>
            <h2 className="text-xl font-bold text-gray-800 relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                <FileText className="w-5 h-5 text-white" />
              </div>
              Input Data Form Ukur
            </h2>
          </div>

          {/* Content */}
          <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-b from-white to-gray-50/30">
            <DetailField
              label="Tanggal Ukur"
              value={formData.tanggal_ukur}
              name="tanggal_ukur"
              type="date"
              onChange={handleInputChange}
            />
            <DetailField
              label="Upload File Form Ukur" // Label diubah sesuai gambar
              value={formData.form_ukur}
              name="form_ukur"
              type="file"
              onChange={handleInputChange}
              onRemove={handleRemoveFile}
              onPreview={handlePreviewFile} // Menggunakan handlePreviewFile yang membuka tab baru
              previewUrl={previewUrl}
            />
          </div>

          {/* Footer */}
          <div className="px-6 lg:px-8 pb-6 lg:pb-8 bg-gradient-to-b from-gray-50/30 to-white">
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                className="rounded-xl px-4 py-2 text-sm lg:px-6 lg:text-base"
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="submit" // Pastikan Anda memiliki varian ini
                disabled={isSubmitting}
                // 4. Ganti style tombol save
                className="rounded-xl px-4 py-2 lg:px-6 text-sm lg:text-base font-semibold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Menyimpan...
                  </span>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
