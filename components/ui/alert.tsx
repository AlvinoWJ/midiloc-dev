"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, X, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { AlertProps } from "@/types/alert.types";

/**
 * Komponen Alert
 * --------------
 * Komponen toast/alert yang muncul di pojok kanan atas,
 * mendukung auto-close dan manual close.
 */
const Alert: React.FC<AlertProps & { onClose?: () => void }> = ({
  type = "info",
  title,
  message,
  duration = 5000,
  autoClose = true,
  actions,
  onClose,
}) => {
  // State untuk mengontrol visibilitas alert
  const [isVisible, setIsVisible] = useState(true);

  /**
   * Auto-close handler
   * Menutup alert otomatis berdasarkan durasi
   */
  useEffect(() => {
    if (autoClose && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer); // cleanup
    }
  }, [autoClose, duration]);

  /**
   * Menutup alert secara manual maupun otomatis
   */
  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose(); // callback ketika alert ditutup
  };

  // Jika alert tidak visible → hentikan render
  if (!isVisible) return null;

  /**
   * Style per jenis alert
   * - Warna background
   * - Border
   * - Icon
   * - Warna teks title & message
   */
  const alertStyles = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      titleColor: "text-green-800",
      messageColor: "text-green-700",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      titleColor: "text-red-800",
      messageColor: "text-red-700",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      titleColor: "text-yellow-800",
      messageColor: "text-yellow-700",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: <Info className="w-5 h-5 text-blue-600" />,
      titleColor: "text-blue-800",
      messageColor: "text-blue-700",
    },
  };

  const style = alertStyles[type];

  return (
    <div
      // Wrapper utama alert di pojok kanan atas + animasi
      className={`fixed top-4 right-4 max-w-md w-full ${style.bg} ${style.border} 
      border rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full duration-300`}
    >
      <div className="p-4">
        <div className="flex items-start">
          {/* Icon sesuai type (success/error/warning/info) */}
          <div className="flex-shrink-0">{style.icon}</div>

          {/* Bagian teks dan tombol action */}
          <div className="ml-3 flex-1">
            {/* Title alert */}
            {title && (
              <h3 className={`text-sm font-medium ${style.titleColor}`}>
                {title}
              </h3>
            )}

            {/* Pesan alert */}
            <p
              className={`text-sm ${style.messageColor} ${title ? "mt-1" : ""}`}
            >
              {message}
            </p>

            {/* Aksi tambahan (Undo, Retry, dsb) */}
            {actions && <div className="mt-3 flex gap-2">{actions}</div>}
          </div>

          {/* Tombol close */}
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="inline-flex rounded-md p-1.5 hover:bg-opacity-20 
              hover:bg-gray-900 focus:outline-none focus:ring-2 
              focus:ring-offset-2 focus:ring-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alert;
