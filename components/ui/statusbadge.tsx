import React from "react";
import { cn } from "@/lib/utils";

// Tipe dasar untuk status yang diterima
type Status = string;

interface StatusBadgeProps {
  status: Status; // Status yang akan ditampilkan (mis: "OK", "NOK", dsb.)
  className?: string; // Optional: tambahan className eksternal
}

// Mapping setiap status ke warna background + warna teks
// Menggunakan tailwind utility class yang sudah kamu definisikan sebelumnya
const statusColors: Record<Status, string> = {
  "In Progress": "bg-progress text-primary-foreground",
  OK: "bg-submit text-primary-foreground",
  NOK: "bg-primary text-primary-foreground",
  "Need Input": "bg-gray-400 text-primary-foreground",
  "Waiting For Forum": "bg-progress text-primary-foreground",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        // Style dasar badge
        "min-h-[48px] px-3 py-1 text-sm font-medium flex items-center justify-center rounded w-28",
        // Warna sesuai status dari mapping `statusColors`
        statusColors[status],
        // Tambahan className dari luar jika ada
        className
      )}
    >
      {/* Isi teks badge adalah nama status */}
      {status}
    </span>
  );
}
