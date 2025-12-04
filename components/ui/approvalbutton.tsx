"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

/**
 * Interface Props untuk Panel Status Approval.
 */
interface ApprovalStatusPanelProps {
  currentStatus: string | null; // Status saat ini (tidak dipakai di render, tapi mungkin untuk logic parent)
  disabled: boolean; // Menonaktifkan tombol (misal: user tidak punya akses)
  onApprove: (status: "OK" | "NOK") => void; // Callback saat tombol diklik
  show: boolean; // Kontrol visibilitas seluruh komponen
  fileUploaded: boolean; // Guard: Tombol hanya muncul jika file sudah diupload
  loading?: boolean; // State loading saat proses submit
}

/**
 * Komponen Tombol Approval (OK / NOK).
 * Biasanya digunakan oleh user dengan role tertentu (misal: BM/RM) untuk memvalidasi data.
 */
export function ApprovalStatusbutton({
  disabled,
  onApprove,
  show,
  fileUploaded,
  loading = false,
}: ApprovalStatusPanelProps) {
  // 1. Cek Visibilitas: Jika show false, jangan render apa-apa
  if (!show) return null;

  return (
    <div className="w-full px-2 md:px-0">
      {/* 2. Cek File: Tombol aksi hanya muncul JIKA file bukti sudah diupload */}
      {fileUploaded && (
        <div className="flex gap-3 w-full md:w-auto md:justify-end">
          {/* Tombol NOK (Not OK/Reject) */}
          <Button
            disabled={disabled || loading}
            onClick={() => onApprove("NOK")}
            variant="default" // Biasanya warna merah/abu-abu (tergantung config theme)
            size="default"
            // Responsive: Full width di mobile (flex-1), Fixed width di desktop
            className="flex-1 md:flex-initial md:min-w-[180px] lg:min-w-[200px] h-10 md:h-10"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "NOK"}
          </Button>

          {/* Tombol OK (Approve) */}
          <Button
            disabled={disabled || loading}
            onClick={() => onApprove("OK")}
            variant="submit" // Biasanya warna hijau/biru
            size="default"
            // Responsive: Full width di mobile (flex-1), Fixed width di desktop
            className="flex-1 md:flex-initial md:min-w-[180px] lg:min-w-[200px] h-10 md:h-10"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "OK"}
          </Button>
        </div>
      )}
    </div>
  );
}
