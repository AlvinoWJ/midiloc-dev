// components/ui/inputformukur.tsx
"use client";

import React, { useState, ChangeEvent } from "react"; // Import ChangeEvent
import { Calendar, Upload, FileText, X } from "lucide-react"; // Import ikon
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/shared/alertcontext";
import { FileUpload } from "@/components/ui/uploadfile"; // Gunakan komponen FileUpload
import { Input } from "@/components/ui/input"; // Import Input
import { Label } from "@/components/ui/label"; // Import Label

// Tipe props
interface InputFormUkurProps {
  onSubmit: (formData: FormData) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

export default function InputFormUkur({
  onSubmit,
  onClose,
  isSubmitting,
}: InputFormUkurProps) {
  const { showAlert, showConfirmation } = useAlert();
  const [formData, setFormData] = useState<{
    tanggal_ukur: string; // State untuk tanggal
    form_ukur: File | null; // State untuk file
  }>({
    tanggal_ukur: "",
    form_ukur: null,
  });
  // State untuk error spesifik field
  const [errors, setErrors] = useState<{
    tanggal_ukur?: string;
    form_ukur?: string;
  }>({});

  // Handler untuk input tanggal
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Hapus error jika field diedit
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Handler untuk FileUpload
  const handleFileChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, form_ukur: file }));
    // Hapus error jika file diedit
    if (errors.form_ukur) {
      setErrors((prev) => ({ ...prev, form_ukur: undefined }));
    }
  };

  // Handler untuk submit form
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({}); // Reset error setiap submit

    // --- Validasi Manual Sederhana ---
    const currentErrors: { tanggal_ukur?: string; form_ukur?: string } = {};
    if (!formData.tanggal_ukur) {
      currentErrors.tanggal_ukur = "Tanggal ukur wajib diisi.";
    }
    if (!formData.form_ukur) {
      currentErrors.form_ukur = "File form ukur wajib diupload.";
    } else if (
      formData.form_ukur &&
      formData.form_ukur.size > 15 * 1024 * 1024
    ) {
      // Max 15MB
      currentErrors.form_ukur = "Ukuran file maksimal 15MB.";
    }
    // Tambahkan validasi tipe file jika perlu
    // else if (formData.form_ukur && !['application/pdf', 'image/png', ...].includes(formData.form_ukur.type)) {
    //    currentErrors.form_ukur = "Format file tidak didukung.";
    // }

    setErrors(currentErrors);

    if (Object.keys(currentErrors).length > 0) {
      showAlert({
        type: "error",
        title: "Input Tidak Lengkap",
        message: "Harap isi tanggal ukur dan upload file form ukur.",
      });
      return;
    }
    // --- Akhir Validasi Manual ---

    const confirmed = await showConfirmation({
      title: "Konfirmasi Submit Form Ukur",
      message: `Anda akan menyimpan Form Ukur dengan tanggal ${formData.tanggal_ukur}. Pastikan data sudah benar?`,
      confirmText: "Ya, Simpan",
      cancelText: "Batal",
      type: "info", // Atau 'success'
    });

    if (!confirmed) return;

    try {
      // Buat FormData untuk dikirim
      const dataToSend = new FormData();
      dataToSend.append("tanggal_ukur", formData.tanggal_ukur);
      // Append file hanya jika ada (sudah divalidasi di atas)
      if (formData.form_ukur) {
        dataToSend.append("form_ukur", formData.form_ukur); // Nama field sesuaikan dengan API
      }

      await onSubmit(dataToSend); // Kirim FormData ke parent (page.tsx)
      // onClose(); // Biarkan parent yang menutup setelah onSubmit berhasil
    } catch (error) {
      // Error handling di sini mungkin tidak diperlukan jika onSubmit di parent sudah handle
      console.error("Error submitting Form Ukur data:", error);
      showAlert({
        type: "error",
        title: "Terjadi Kesalahan",
        message: "Gagal menyimpan data Form Ukur.",
      });
    }
  };

  // Handler untuk tombol batal/tutup
  const handleCancel = async () => {
    const hasUnsavedChanges = formData.tanggal_ukur || formData.form_ukur;
    if (hasUnsavedChanges) {
      const confirmed = await showConfirmation({
        title: "Batalkan Input?",
        message: "Perubahan belum disimpan. Yakin ingin menutup?",
        confirmText: "Ya, Tutup",
        cancelText: "Lanjutkan Mengisi",
        type: "warning",
      });
      if (confirmed) onClose();
    } else {
      onClose();
    }
  };

  return (
    // Latar belakang modal (backdrop)
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white rounded-xl shadow-lg border border-gray-200 animate-in zoom-in-95 duration-300" // Tambah animasi
      >
        {/* Header Modal */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          {" "}
          {/* Tambah padding */}
          <h2 className="text-lg font-semibold text-gray-900">
            Input Data Form Ukur {/* Judul diubah */}
          </h2>
          {/* Tombol Close di Header */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Konten Form */}
        <div className="p-6 space-y-5">
          {" "}
          {/* Tambah spasi antar elemen */}
          {/* Input Tanggal Ukur */}
          <div>
            <Label
              htmlFor="tanggal_ukur"
              className="block font-semibold mb-2 text-sm"
            >
              {" "}
              {/* Ukuran font label */}
              Tanggal Ukur <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="w-5 h-5 text-gray-400" />
              </span>
              <Input
                id="tanggal_ukur"
                name="tanggal_ukur" // Name harus sesuai state
                type="date"
                value={formData.tanggal_ukur}
                onChange={handleInputChange}
                className={`w-full p-3 pl-10 border rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm ${
                  errors.tanggal_ukur ? "border-red-500" : "border-gray-300"
                }`} // Ukuran font input
                disabled={isSubmitting} // Disable saat loading
              />
            </div>
            {errors.tanggal_ukur && (
              <p className="text-red-500 text-xs mt-1">{errors.tanggal_ukur}</p>
            )}
          </div>
          {/* File Upload Form Ukur */}
          <FileUpload
            label="Upload File Form Ukur" // Label diubah
            name="form_ukur" // Name harus sesuai state & FormData
            value={formData.form_ukur}
            onChange={handleFileChange} // Gunakan handler file change
            accept=".pdf,.png,.jpg,.jpeg,.webp" // Sesuaikan tipe file yang diizinkan
            maxSizeMB={15} // Sesuaikan batas ukuran
          />
          {errors.form_ukur && (
            <p className="text-red-500 text-xs mt-1">{errors.form_ukur}</p>
          )}
          {/* Footer Tombol Aksi */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t mt-6">
            {" "}
            {/* Tambah border atas */}
            <Button
              type="button"
              variant="back" // Sesuaikan variant jika perlu
              onClick={handleCancel}
              className="rounded-full px-6 py-2 text-sm" // Ukuran tombol
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="submit"
              disabled={isSubmitting}
              className="rounded-full px-6 py-2 text-sm" // Ukuran tombol
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Form Ukur"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
