"use client";

import React, { useState } from "react";
import { Upload, Calendar, FileText } from "lucide-react";
import CustomSelect from "@/components/ui/customselect"; // Import CustomSelect component
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/desktop/alertcontext";
import { FileUpload } from "@/components/ui/uploadfile";

// Tipe untuk props yang akan diterima komponen ini
interface InputIntipFormProps {
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
  type?: string;
  options?: string[];
}

const DetailField = ({
  label,
  value,
  name,
  onChange,
  type = "text",
  options = [],
}: DetailFieldProps) => {
  if (type === "file") {
    const fileValue = value as File | null;
    return (
      <div className="col-span-2">
        <label className="block font-semibold mb-2">{label}*</label>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 lg:p-8 text-center hover:border-red-400 transition-colors cursor-pointer bg-gray-50"
          onClick={() => document.getElementById(name)?.click()}
        >
          <input
            id={name}
            name={name}
            type="file"
            className="hidden"
            onChange={onChange}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />

          {value ? (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm lg:text-base text-gray-600">
                {fileValue?.name}
              </p>
              <p className="text-xs lg:text-base text-gray-400 mt-1">
                File berhasil diupload
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-red-100 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Upload file disini</p>
              <p className="text-xs text-gray-400">
                PDF, DOC, JPG, PNG (Max 10MB)
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === "select") {
    return (
      <div>
        <CustomSelect
          id={name}
          name={name}
          label={label}
          placeholder={`Pilih ${label}`}
          value={String(value || "")}
          options={options}
          onChange={onChange}
        />
      </div>
    );
  }

  return (
    <div>
      <label className="block font-semibold mb-2 text-base lg:text-lg">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type={type}
          value={String(value || "")}
          onChange={onChange}
          name={name}
          className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>
    </div>
  );
};

export default function InputIntipForm({
  onSubmit,
  onClose,
  isSubmitting,
}: InputIntipFormProps) {
  const { showAlert, showToast, showConfirmation } = useAlert();
  const [formData, setFormData] = useState<{
    approval_intip: string;
    tanggal_approval_intip: string;
    file_intip: File | null;
  }>({
    approval_intip: "", // Gunakan string kosong sebagai nilai awal yang lebih netral
    tanggal_approval_intip: "",
    file_intip: null,
  });

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, files } = event.target as HTMLInputElement;
    if (files) {
      console.log("File yang dipilih:", files[0]);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log("State formData sebelum submit:", formData);

    if (
      !formData.approval_intip ||
      !formData.tanggal_approval_intip ||
      !formData.file_intip
    ) {
      showAlert({
        type: "error",
        title: "Gagal Menyimpan",
        message: "Semua field wajib diisi.",
        duration: 5000,
      });
      return;
    }

    if (formData.file_intip && formData.file_intip.size > 10 * 1024 * 1024) {
      showAlert({
        type: "error",
        title: "File Terlalu Besar",
        message:
          "Ukuran file maksimal 10MB. Silakan pilih file yang lebih kecil.",
        duration: 5000,
      });
      return;
    }

    const confirmed = await showConfirmation({
      title: "Konfirmasi Submit Data INTIP",
      message: `Apakah Anda yakin ingin menyimpan data INTIP dengan status "${formData.approval_intip}"? Pastikan semua data sudah benar.`,
      confirmText: "Ya, Simpan Data",
      cancelText: "Periksa Kembali",
      type: "success",
    });

    if (!confirmed) return;

    try {
      // PENTING: Gunakan FormData untuk mengirim file
      const dataToSend = new FormData();
      dataToSend.append("approval_intip", formData.approval_intip);
      dataToSend.append(
        "tanggal_approval_intip",
        formData.tanggal_approval_intip
      );
      if (formData.file_intip) {
        dataToSend.append("file_intip", formData.file_intip);
      }

      // LOG 3: Cek isi dari FormData sebelum dikirim
      console.log("--- Mengecek isi FormData ---");
      for (let pair of dataToSend.entries()) {
        console.log(pair[0] + ": ", pair[1]);
      }
      console.log("----------------------------");

      await onSubmit(dataToSend);

      onClose();
    } catch (error) {
      console.error("Error submitting INTIP data:", error);

      showAlert({
        type: "error",
        title: "Terjadi Kesalahan",
        message:
          "Gagal menyimpan data INTIP. Silakan periksa koneksi internet Anda dan coba lagi.",
        duration: 6000,
      });
    }
  };

  const handleCancel = async () => {
    // Cek apakah ada data yang sudah diisi oleh pengguna
    const hasUnsavedChanges =
      formData.approval_intip ||
      formData.tanggal_approval_intip ||
      formData.file_intip;

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
        onClose();
      }
    } else {
      // Jika form masih kosong, langsung tutup tanpa konfirmasi
      onClose();
    }
  };

  const statusOptions = ["OK", "NOK"];

  return (
    // Latar belakang modal
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <form
        onSubmit={handleSubmit}
        className="w-[90%] max-w-md bg-white rounded-xl shadow-lg border border-gray-200 sm:w-[80%] lg:w-[70%]"
      >
        {/* Header */}
        <div className="border-b px-4 py-3">
          <h2 className="text-base lg:text-lg font-medium text-gray-900">
            Input Status INTIP
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 lg:p-6 space-y-4 lg:space-y-4">
          <DetailField
            label="Status INTIP"
            value={formData.approval_intip}
            name="approval_intip"
            type="select"
            options={statusOptions}
            onChange={handleInputChange}
          />
          <DetailField
            label="Tanggal Approval INTIP"
            value={formData.tanggal_approval_intip}
            name="tanggal_approval_intip"
            type="date"
            onChange={handleInputChange}
          />
          <FileUpload
            label="Bukti Approval INTIP"
            value={formData.file_intip}
            name="file_intip"
            onChange={(file) =>
              setFormData((prev) => ({ ...prev, file_intip: file }))
            }
          />
          {/* Footer dengan tombol aksi */}
          <div className="flex flex-col lg:flex-row justify-end gap-2 lg:gap-3 rounded-b-xl">
            <Button
              type="button"
              variant="default"
              onClick={handleCancel}
              className="rounded-full px-4 py-2 text-sm lg:px-6 lg:text-base"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="submit"
              disabled={isSubmitting}
              className="hover:bg-green-600 text-white rounded-full px-4 py-2 text-sm lg:px-6 lg:text-base"
            >
              {isSubmitting ? "Menyimpan..." : "Save"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
