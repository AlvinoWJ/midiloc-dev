"use client";

import React, { useState } from "react";
import { Upload, Calendar, FileText } from "lucide-react";
import CustomSelect from "@/components/ui/customselect"; // Import CustomSelect component
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/alertcontext";

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
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-400 transition-colors cursor-pointer bg-gray-50"
          onClick={() => document.getElementById(name)?.click()}
        >
          <input
            id={name}
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
              <p className="text-sm text-gray-600">{fileValue?.name}</p>
              <p className="text-xs text-gray-400 mt-1">
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
      <label className="block font-semibold mb-2">{label}*</label>
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
    statusIntip: string;
    tanggalApproval: string;
    buktiApproval: File | null;
  }>({
    statusIntip: "Status INTIP",
    tanggalApproval: "",
    buktiApproval: null,
  });

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, files } = event.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !formData.statusIntip ||
      formData.statusIntip === "Status INTIP" ||
      !formData.tanggalApproval ||
      !formData.buktiApproval
    ) {
      showAlert({
        type: "error",
        title: "Validasi Gagal",
        message:
          "Semua field wajib diisi dengan benar. Pastikan status INTIP dipilih, tanggal diisi, dan file diupload.",
        duration: 5000,
      });
      return;
    }

    // Validasi ukuran file (Max 10MB)
    if (
      formData.buktiApproval &&
      formData.buktiApproval.size > 10 * 1024 * 1024
    ) {
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
      message: `Apakah Anda yakin ingin menyimpan data INTIP dengan status "${formData.statusIntip}"? Pastikan semua data sudah benar.`,
      confirmText: "Ya, Simpan Data",
      cancelText: "Periksa Kembali",
      type: "info",
    });

    if (!confirmed) {
      // User membatalkan submit
      showToast({
        type: "info",
        message: "Submit data dibatalkan. Silakan periksa kembali data Anda.",
        duration: 3000,
      });
      return;
    }

    try {
      // PENTING: Gunakan FormData untuk mengirim file
      const dataToSend = new FormData();
      dataToSend.append("approval_intip", formData.statusIntip);
      dataToSend.append("tanggal_approval_intip", formData.tanggalApproval);
      dataToSend.append("file_intip", formData.buktiApproval);

      // Panggil fungsi onSubmit dari props dengan data yang sudah siap
      await onSubmit(dataToSend);

      // Success notification
      showToast({
        type: "success",
        title: "Berhasil Disimpan!",
        message: "Data INTIP berhasil disimpan ke sistem.",
        duration: 4000,
      });

      // Close modal setelah berhasil
      onClose();
    } catch (error) {
      // Error handling dengan alert profesional
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
    // Jika ada data yang sudah diisi, konfirmasi sebelum cancel
    if (
      formData.statusIntip !== "Status INTIP" ||
      formData.tanggalApproval ||
      formData.buktiApproval
    ) {
      const confirmed = await showConfirmation({
        title: "Konfirmasi Submit",
        message: "Yakin ingin menyimpan?",
        confirmText: "Ya, Simpan",
        cancelText: "Batal",
        type: "info",
      });

      if (confirmed) {
        onClose();
      }
    } else {
      // Jika belum ada data, langsung close
      onClose();
    }
  };

  const statusOptions = ["Status Intip", "OK", "Not OK"];

  return (
    // Latar belakang modal
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <form
        onSubmit={handleSubmit}
        className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200"
      >
        {/* Header */}
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-medium text-gray-900">
            Input Status INTIP
          </h2>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 ">
          <DetailField
            label="Status INTIP"
            value={formData.statusIntip}
            name="statusIntip"
            type="select"
            options={statusOptions}
            onChange={handleInputChange}
          />
          <DetailField
            label="Tanggal Approval INTIP"
            value={formData.tanggalApproval}
            name="tanggalApproval"
            type="date"
            onChange={handleInputChange}
          />
          <DetailField
            label="Bukti Approval INTIP"
            value={formData.buktiApproval}
            name="buktiApproval"
            type="file"
            onChange={handleInputChange}
          />
        </div>

        {/* Footer dengan tombol aksi */}
        <div className="flex justify-end gap-3 p-4 rounded-b-xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="rounded-full px-6"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-submit hover:bg-green-600 text-white rounded-full px-6"
          >
            {isSubmitting ? "Menyimpan..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
