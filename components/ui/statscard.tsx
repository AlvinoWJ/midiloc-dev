// components/ui/statscard.tsx
"use client";

import Image from "next/image";

interface StatsCardProps {
  title: string; // Judul kecil pada kartu (mis: Total User)
  value: string | number; // Nilai statistik yang ditampilkan
  icon?: string; // Optional: path icon atau elemen React
  color?: "blue" | "purple" | "green" | "orange"; // Tema warna kartu
}

export function StatsCard({
  title,
  value,
  icon,
  color = "blue", // Default tema warna biru
}: StatsCardProps) {
  // Kumpulan class warna untuk teks nilai utama
  const textColorClasses = {
    blue: "text-blue-600",
    purple: "text-purple-600",
    green: "text-green-600",
    orange: "text-orange-600",
  };

  // Warna background untuk container icon
  const containerColorClasses = {
    blue: "bg-blue-100",
    purple: "bg-purple-100",
    green: "bg-green-100",
    orange: "bg-orange-100",
  };

  // Warna background blur efek glowing di belakang icon
  const blurBgColorClasses = {
    blue: "bg-blue-300",
    purple: "bg-purple-300",
    green: "bg-green-300",
    orange: "bg-orange-300",
  };

  return (
    // Wrapper utama kartu — border, shadow, dan padding
    <div className="bg-white rounded-2xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] border border-gray-100 p-3.5">
      {/* Baris utama berisi teks dan icon, menggunakan gap agar konsisten */}
      <div className="flex items-center justify-between gap-4">
        {/* Bagian kiri: judul + nilai */}
        <div className="flex-1">
          {/* Judul kecil */}
          <p className="text-xs text-gray-500">{title}</p>

          {/* Nilai utama, warna mengikuti tema */}
          <p
            className={`text-2xl md:text-3xl font-bold ${textColorClasses[color]}`}
          >
            {value}
          </p>
        </div>

        {/* Bagian kanan: icon + background blur */}
        {icon && (
          <div className="flex-shrink-0 relative">
            {/* Lapisan blur glow di belakang icon */}
            <div
              className={`absolute inset-0 ${blurBgColorClasses[color]} opacity-30 rounded-full`}
            ></div>

            {/* Container icon berwarna lembut */}
            <div
              className={`relative ${containerColorClasses[color]} rounded-xl p-3 flex items-center justify-center`}
            >
              {/* Jika icon berupa path gambar */}
              {typeof icon === "string" ? (
                <Image src={icon} alt="icon" width={24} height={24} />
              ) : (
                // Jika icon berupa ReactNode (SVG dari lucide-react atau icon custom)
                icon
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
