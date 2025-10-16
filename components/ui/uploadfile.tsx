"use client";

import React, { useRef, useState, useEffect } from "react";
import { Upload, FileText, X } from "lucide-react";

interface FileUploadProps {
  label: string;
  name: string;
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  name,
  value,
  onChange,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  maxSizeMB = 15,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // Membuat dan membersihkan object URL untuk preview
    if (value) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > maxSizeMB * 1024 * 1024) {
      alert(`Ukuran file maksimal ${maxSizeMB}MB`);
      e.target.value = ""; // Reset input jika file terlalu besar
      return;
    }
    onChange(file);
  };

  const handleRemoveFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Mencegah terbukanya dialog file
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = ""; // Reset nilai input file
    }
  };

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  return (
    <div className="col-span-2">
      <label className="block font-semibold mb-2 text-sm lg:text-lg">
        {label}
        <span className="text-red-500">*</span>
      </label>

      {/* === PERUBAHAN 1 ===
        - Menambahkan `min-h-[250px]` agar tinggi kontainer konsisten.
        - Menambahkan `flex flex-col justify-center` untuk memusatkan konten secara vertikal.
      */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors cursor-pointer bg-gray-50 min-h-[250px] flex flex-col justify-center items-center"
        onClick={() => !value && openFileDialog()}
      >
        <input
          ref={inputRef}
          id={name}
          name={name}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
        />

        {value && previewUrl ? (
          // === Tampilan setelah file di-upload ===
          <div className="text-center space-y-2 w-full flex flex-col items-center">
            {/* === PERUBAHAN 2 ===
              - Wadah `relative` tunggal untuk menampung preview (gambar/ikon)
                dan tombol hapus yang absolut. Ini menyatukan logika.
            */}
            <div className="relative inline-block">
              <button
                type="button"
                onClick={handleRemoveFile}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors z-10 shadow-md"
                aria-label="Hapus file"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Tampilan kondisional berdasarkan tipe file */}
              {value.type.startsWith("image/") ? (
                // Preview untuk Gambar
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="mx-auto max-h-40 rounded-md shadow border object-contain"
                  onClick={openFileDialog}
                />
              ) : (
                // Preview untuk PDF dan file lainnya
                <div
                  className="flex flex-col items-center justify-center p-4 rounded-md text-gray-600 hover:text-red-500"
                  onClick={() => {
                    if (value.type === "application/pdf") {
                      window.open(previewUrl, "_blank");
                    } else {
                      openFileDialog();
                    }
                  }}
                >
                  <FileText className="w-16 h-16" />
                  {value.type === "application/pdf" && (
                    <span className="text-xs mt-1 font-semibold">Buka PDF</span>
                  )}
                </div>
              )}
            </div>

            {/* Nama file dan info */}
            <p className="text-sm text-gray-700 break-words pt-2 max-w-full">
              {value.name}
            </p>
            <p
              className="text-xs text-blue-500 hover:underline cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                openFileDialog();
              }}
            >
              Ganti file
            </p>
          </div>
        ) : (
          // === Tampilan Awal (Kosong) ===
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
              <Upload className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-base text-gray-600 mb-1">
              Klik untuk mengupload file
            </p>
            <p className="text-sm text-gray-400">
              PDF, DOC, JPG, PNG (Maks {maxSizeMB} MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
