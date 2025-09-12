"use client";

import React from "react";

interface ApprovalStatusPanelProps {
  currentStatus: string | null;
  disabled: boolean;
  onApprove: (status: "OK" | "NOK") => void;
  show: boolean; // tampil / tidak
  fileUploaded: boolean; // apakah file intip sudah ada
  loading?: boolean;
}

export function ApprovalStatusPanel({
  currentStatus,
  disabled,
  onApprove,
  show,
  fileUploaded,
  loading = false,
}: ApprovalStatusPanelProps) {
  if (!show) return null;

  return (
    <div className="mt-6 border-t pt-4 px-4 md:px-6">
      <p className="text-sm mb-2">
        Approval Status saat ini:{" "}
        <span className="font-semibold">{currentStatus || "-"}</span>
      </p>

      {!fileUploaded && (
        <p className="text-xs text-amber-600 mb-3">
          File Intip belum diupload. Upload terlebih dahulu sebelum melakukan
          approval.
        </p>
      )}

      {fileUploaded && (
        <div className="flex gap-3">
          <button
            disabled={disabled || loading}
            onClick={() => onApprove("OK")}
            className={`px-4 py-2 rounded text-sm font-medium ${
              disabled || loading
                ? "bg-green-200 text-green-700 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {disabled || loading ? "Memproses..." : "Set OK"}
          </button>
          <button
            disabled={disabled || loading}
            onClick={() => onApprove("NOK")}
            className={`px-4 py-2 rounded text-sm font-medium ${
              disabled || loading
                ? "bg-red-200 text-red-700 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {disabled || loading ? "Memproses..." : "Set NOK"}
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-3">
        Aksi ini otomatis menambahkan approved_by & approved_at (logic backend).
      </p>
    </div>
  );
}
