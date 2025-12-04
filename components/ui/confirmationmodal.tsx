"use client";

import React from "react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { ConfirmationModalProps } from "@/types/alert.types";

/**
 * Komponen Modal Konfirmasi Generik.
 * Digunakan untuk meminta persetujuan user sebelum melakukan aksi penting (Hapus, Submit, Logout, dll).
 *
 * Fitur:
 * - Mendukung 4 tipe visual: 'success', 'error', 'warning', 'info'.
 * - Menutup modal saat klik di luar area konten (backdrop).
 * - Teks judul dan tombol yang dapat dikustomisasi.
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title = "Konfirmasi",
  message = "Apakah Anda yakin ingin melanjutkan?",
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  type = "info",
  onConfirm,
  onCancel,
}) => {
  // Kondisional Rendering: Jika tidak open, jangan render apa pun ke DOM
  if (!isOpen) return null;

  /**
   * Konfigurasi Style berdasarkan tipe modal.
   * Mengelompokkan icon, warna background icon, dan warna tombol confirm
   * agar JSX tetap bersih dan mudah dipelihara.
   */
  const modalStyles = {
    success: {
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      confirmBtn: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
      iconBg: "bg-green-100",
    },
    error: {
      icon: <AlertCircle className="w-6 h-6 text-red-600" />,
      confirmBtn: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      iconBg: "bg-red-100",
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
      confirmBtn: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
      iconBg: "bg-yellow-100",
    },
    info: {
      icon: <Info className="w-6 h-6 text-blue-600" />,
      confirmBtn: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      iconBg: "bg-blue-100",
    },
  };

  // Pilih style berdasarkan props 'type'
  const style = modalStyles[type];

  /**
   * Handler untuk menutup modal saat user mengklik area gelap (backdrop).
   * PENTING: Menggunakan `e.target === e.currentTarget` untuk memastikan
   * modal TIDAK tertutup jika user mengklik bagian dalam kotak putih (content).
   */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      // Overlay / Backdrop (Fixed position covering entire screen)
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      {/* Modal Content Container */}
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
        <div className="p-6">
          <div className="flex items-start mb-4">
            {/* Icon Section (Dynamic Color) */}
            <div
              className={`flex-shrink-0 ${style.iconBg} rounded-full p-2 mr-4`}
            >
              {style.icon}
            </div>

            {/* Text Content (Title & Message) */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
            </div>

            {/* Close Button (X) di pojok kanan atas */}
            <button
              onClick={onCancel}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Buttons Footer */}
          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white ${style.confirmBtn} rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
