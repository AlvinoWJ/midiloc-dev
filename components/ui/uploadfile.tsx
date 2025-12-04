"use client";

import React, { useRef, useState, useEffect } from "react";
import { Upload, FileText, X } from "lucide-react";

interface FileUploadProps {
  label: string; // Label field upload
  name: string; // Nama input untuk form
  value: File | null; // File yang sedang dipilih
  onChange: (file: File | null) => void; // Handler perubahan file
  accept?: string; // Tipe file yang diperbolehkan
  maxSizeMB?: number; // Batas ukuran file
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  name,
  value,
  onChange,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  maxSizeMB = 15,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null); // Referensi ke input file
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // URL preview file

  useEffect(() => {
    /**
     * Membuat object URL untuk preview file, lalu
     * membersihkannya saat file berubah atau komponen unmount.
     */
    if (value) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);

      return () => URL.revokeObjectURL(url); // Cleanup
    }
    setPreviewUrl(null);
  }, [value]);

  /**
   * Handler ketika file dipilih
   * - Validasi ukuran file
   * - Kirim file ke parent melalui onChange
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file && file.size > maxSizeMB * 1024 * 1024) {
      alert(`Ukuran file maksimal ${maxSizeMB}MB`);
      e.target.value = ""; // Reset input
      return;
    }

    onChange(file);
  };

  /**
   * Menghapus file yang dipilih
   * - Tidak membuka dialog upload
   * - Reset inputRef & state
   */
  const handleRemoveFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onChange(null);

    if (inputRef.current) {
      inputRef.current.value = ""; // Reset input file
    }
  };

  /**
   * Membuka dialog pemilihan file
   */
  const openFileDialog = () => {
    inputRef.current?.click();
  };

  return (
    <div className="col-span-2">
      {/* Label Upload */}
      <label className="block font-semibold mb-2 text-sm lg:text-lg">
        {label}
        <span className="text-red-500">*</span>
      </label>

      {/**
       * Kontainer utama upload
       * ----------------------------------------------------
       * PERUBAHAN 1:
       * + Menambahkan min-h agar konsisten
       * + Flexbox untuk memusatkan konten secara vertikal
       */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors cursor-pointer bg-gray-50 min-h-[250px] flex flex-col justify-center items-center"
        onClick={() => !value && openFileDialog()}
      >
        {/* Input file (disembunyikan) */}
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
          // ==== Tampilan saat file sudah di-upload ====
          <div className="text-center space-y-2 w-full flex flex-col items-center">
            {/**
             * PERUBAHAN 2:
             * Wadah relative untuk:
             *  - Preview file (gambar / ikon)
             *  - Tombol remove (absolute)
             */}
            <div className="relative inline-block">
              {/* Tombol hapus file */}
              <button
                type="button"
                onClick={handleRemoveFile}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors z-10 shadow-md"
                aria-label="Hapus file"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Preview untuk gambar */}
              {value.type.startsWith("image/") ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="mx-auto max-h-40 rounded-md shadow border object-contain"
                  onClick={openFileDialog}
                />
              ) : (
                /**
                 * Preview untuk PDF atau file lainnya:
                 * - Jika PDF → buka tab baru
                 * - Selain itu → buka dialog pilih file
                 */
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

            {/* Nama file */}
            <p className="text-sm text-gray-700 break-words max-w-full">
              {value.name}
            </p>

            {/* Ganti file */}
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
          // ==== Tampilan awal (belum ada file) ====
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
              <Upload className="w-7 h-7 text-red-500" />
            </div>

            <p className="text-base text-gray-600 mb-1">
              Klik untuk mengupload file
            </p>

            <p className="text-sm text-gray-400">PDF (Maks {maxSizeMB} MB)</p>
          </div>
        )}
      </div>
    </div>
  );
};
