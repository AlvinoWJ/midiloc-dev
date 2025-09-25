"use client";

import React, { useRef, useState, useEffect } from "react";
import { Upload, FileText } from "lucide-react";

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
  maxSizeMB = 10,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // generate preview url setiap kali file berubah
  useEffect(() => {
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
      e.target.value = ""; // reset
      return;
    }
    onChange(file);
  };

  return (
    <div className="col-span-2">
      <label className="block font-semibold mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-400 transition-colors cursor-pointer bg-gray-50"
        onClick={() => inputRef.current?.click()}
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

        {value ? (
          <div className="text-center space-y-3">
            {/* Jika file gambar → tampilkan preview */}
            {value.type.startsWith("image/") && previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="mx-auto max-h-40 rounded-md shadow border object-contain"
              />
            )}

            {/* Jika file PDF → tampilkan ikon FileText untuk preview */}
            {value.type === "application/pdf" && previewUrl && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(previewUrl, "_blank");
                  }}
                  className="flex flex-col items-center text-red-500 hover:text-red-700"
                >
                  <FileText className="w-12 h-12" />
                  <span className="text-xs mt-1">Preview PDF</span>
                </button>
              </div>
            )}

            {/* Nama file */}
            <p className="text-sm text-gray-600">{value.name}</p>
            <p className="text-xs text-gray-400 mt-1">File berhasil diupload</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-red-100 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Upload file disini</p>
            <p className="text-xs text-gray-400">
              PDF, DOC, JPG, PNG (Max {maxSizeMB}MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
