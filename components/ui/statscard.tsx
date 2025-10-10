// components/ui/statscard.tsx
"use client";

import Image from "next/image";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: string;
  color?: "blue" | "purple" | "green" | "orange";
}

export function StatsCard({
  title,
  value,
  icon,
  color = "blue",
}: StatsCardProps) {
  const textColorClasses = {
    blue: "text-blue-600",
    purple: "text-purple-600",
    green: "text-green-600",
    orange: "text-orange-600",
  };

  const containerColorClasses = {
    blue: "bg-blue-100",
    purple: "bg-purple-100",
    green: "bg-green-100",
    orange: "bg-orange-100",
  };

  const blurBgColorClasses = {
    blue: "bg-blue-300",
    purple: "bg-purple-300",
    green: "bg-green-300",
    orange: "bg-orange-300",
  };

  return (
    // DIUBAH: Padding disesuaikan agar lebih ringkas
    <div className="bg-white rounded-2xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] border border-gray-100 p-3.5">
      {/* DIUBAH: Menambahkan 'gap-4' untuk spasi konsisten */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {/* DIUBAH: Margin bawah (mb-1) dihapus & font size diubah */}
          <p className="text-xs text-gray-500">{title}</p>
          {/* DIUBAH: Font size disesuaikan */}
          <p
            className={`text-2xl md:text-3xl font-bold ${textColorClasses[color]}`}
          >
            {value}
          </p>
        </div>
        {icon && (
          <div className="flex-shrink-0 relative">
            <div
              className={`absolute inset-0 ${blurBgColorClasses[color]} opacity-30 rounded-full`}
            ></div>
            <div
              className={`relative ${containerColorClasses[color]} rounded-xl p-3 flex items-center justify-center`}
            >
              {typeof icon === "string" ? (
                <Image src={icon} alt="icon" width={24} height={24} />
              ) : (
                icon
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
