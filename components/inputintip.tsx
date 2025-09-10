"use client";

import React, { useState } from "react";
import { Upload, Calendar, FileText } from "lucide-react";

// Tipe untuk props yang akan diterima komponen ini
interface InputIntipFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

type OptionType = {
  value: string;
  label: string;
};

interface DetailFieldProps {
  label: string;
  value: string | File | null;
  name: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  type?: string;
  options?: OptionType[];
}

// Komponen helper kecil untuk field, bisa ditaruh di file terpisah jika mau
const DetailField = ({
  label,
  value,
  name,
  onChange,
  type = "text",
  options,
}: DetailFieldProps) => {
  if (type === "file") {
    const fileValue = value as File | null;
    return (
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}*
        </label>
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}*
        </label>
        <div className="relative">
          <select
            value={String(value || "")}
            onChange={onChange}
            name={name}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none bg-white text-gray-700"
          >
            <option value="">{label}</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}*
      </label>
      <div className="relative">
        <input
          type={type}
          value={String(value || "")}
          onChange={onChange}
          name={name}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
        {type === "date" && (
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        )}
      </div>
    </div>
  );
};

export default function InputIntipForm({
  onSubmit,
  onClose,
  isSubmitting,
}: InputIntipFormProps) {
  const [formData, setFormData] = useState<{
    statusIntip: string;
    tanggalApproval: string;
    buktiApproval: File | null;
  }>({
    statusIntip: "OK", // Default value
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

    // Validasi sederhana
    if (
      !formData.statusIntip ||
      !formData.tanggalApproval ||
      !formData.buktiApproval
    ) {
      alert("Semua field wajib diisi.");
      return;
    }

    // PENTING: Gunakan FormData untuk mengirim file
    const dataToSend = new FormData();
    dataToSend.append("approval_intip", formData.statusIntip);
    dataToSend.append("tanggal_approval_intip", formData.tanggalApproval);
    dataToSend.append("file_intip", formData.buktiApproval);

    // Panggil fungsi onSubmit dari props dengan data yang sudah siap
    await onSubmit(dataToSend);
  };

  const statusOptions = [
    { value: "OK", label: "OK" },
    { value: "Not OK", label: "Not OK" },
  ];

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
        <div className="p-4 space-y-4">
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
        <div className="flex justify-end gap-3 bg-gray-50 p-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-white border rounded-md hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border rounded-md hover:bg-red-700 disabled:bg-red-300"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
