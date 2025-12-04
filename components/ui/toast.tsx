"use client";

import React from "react";
import { CheckCircle, X, AlertCircle, Info, AlertTriangle } from "lucide-react"; // Icon notifikasi
import { ToastNotification } from "@/types/alert.types";

interface ToastContainerProps {
  notifications: ToastNotification[]; // Array notifikasi yang sedang aktif
  removeNotification: (id: string) => void; // Fungsi untuk menghapus notifikasi berdasarkan ID
}

const Toast: React.FC<ToastContainerProps> = ({
  notifications,
  removeNotification,
}) => {
  /**
   * Mengembalikan icon berdasarkan tipe notifikasi
   */
  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />; // Icon sukses
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />; // Icon error
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />; // Icon warning
      default:
        return <Info className="w-5 h-5 text-blue-500" />; // Icon info
    }
  };

  /**
   * Mengembalikan warna border kiri berdasarkan tipe notifikasi
   */
  const getBorderColor = (type: string) => {
    switch (type) {
      case "success":
        return "border-green-500";
      case "error":
        return "border-red-500";
      case "warning":
        return "border-yellow-500";
      default:
        return "border-blue-500";
    }
  };

  return (
    // Container utama: fixed di kanan atas, stack vertical, z-index tinggi
    <div className="fixed top-4 right-4 space-y-2 z-50 max-w-sm">
      {/* Render setiap notifikasi */}
      {notifications.map((notification) => (
        <div
          key={notification.id} // ID unik per notifikasi
          className={`w-full bg-white shadow-lg rounded-lg border-l-4 ${getBorderColor(
            notification.type
          )} animate-in slide-in-from-right-full duration-300`} // Animasi masuk
        >
          <div className="p-4">
            <div className="flex items-start">
              {/* Icon notifikasi */}
              <div className="flex-shrink-0">{getIcon(notification.type)}</div>

              {/* Title + message */}
              <div className="ml-3 flex-1">
                {notification.title && (
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                )}

                {/* Pesan utama */}
                <p
                  className={`text-sm text-gray-600 ${
                    notification.title ? "mt-1" : ""
                  }`}
                >
                  {notification.message}
                </p>
              </div>

              {/* Tombol close */}
              <div className="ml-4">
                <button
                  onClick={() => removeNotification(notification.id)} // Menghapus notifikasi
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" /> {/* Icon close */}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Toast;
