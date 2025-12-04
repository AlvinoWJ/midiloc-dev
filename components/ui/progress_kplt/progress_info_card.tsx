import React from "react";
import { useRouter } from "next/navigation";
import { Edit } from "lucide-react";

/**
 * Interface untuk props kartu progress.
 * @param progressPercentage - Nilai integer 0-100 untuk visualisasi bar.
 * @param detailPath - Base URL untuk navigasi (misal: "/progress/detail/").
 */
interface ProgressInfoCardProps {
  id: string;
  nama: string;
  alamat: string;
  created_at: string;
  status: string;
  progressPercentage: number; // Progress dalam persen (0-100)
  detailPath: string;
}

/**
 * Komponen Kartu Informasi dengan Visual Progress Bar.
 * Digunakan pada halaman list/dashboard untuk menampilkan ringkasan status item.
 */
export const ProgressInfoCard: React.FC<ProgressInfoCardProps> = ({
  id,
  nama,
  alamat,
  created_at,
  status,
  progressPercentage,
  detailPath,
}) => {
  const router = useRouter();

  // Handler navigasi saat kartu diklik
  const handleCardClick = () => {
    router.push(`${detailPath}${id}`);
  };

  // Formatter tanggal ke format Indonesia (contoh: 20 Oktober 2023)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  /**
   * Menentukan warna visual bar berdasarkan persentase kemajuan.
   * - 0%      : Abu-abu (Belum mulai)
   * - < 30%   : Merah (Awal)
   * - 30-69%  : Kuning (Pertengahan)
   * - >= 70%  : Hijau (Hampir Selesai/Selesai)
   */
  const getProgressColor = (percentage: number): string => {
    if (percentage === 0) return "bg-gray-300";
    if (percentage < 30) return "bg-red-500";
    if (percentage < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const progressColor = getProgressColor(progressPercentage);

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-md hover:shadow-[1px_1px_6px_rgba(0,0,0,0.25)] transition-all cursor-pointer group flex flex-col"
    >
      {/* Header: Nama & Icon Edit */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg lg:text-xl font-bold text-gray-900 transition-colors truncate">
            {nama}
          </h3>
        </div>
        <div className="ml-2 p-2 text-gray-700 rounded-lg transition-all flex-shrink-0">
          <Edit className="w-5 h-5" />
        </div>
      </div>

      {/* Alamat: Dibatasi maksimal 2 baris (line-clamp-2) */}
      <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
        {alamat}
      </p>

      {/* Divider */}
      <div className="border-t border-gray-100 my-4"></div>

      {/* Footer: Progress Bar dan Tanggal */}
      <div className="flex items-center justify-between text-sm gap-4 mt-auto">
        {/* Container Progress Bar */}
        <div className="flex-1 relative">
          {/* 'group/progress' digunakan untuk trigger hover pada tooltip di dalamnya */}
          <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden cursor-pointer group/progress">
            {/* Visual Bar yang terisi */}
            <div
              className={`h-full ${progressColor} rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${progressPercentage}%` }}
            ></div>

            {/* --- CUSTOM TOOLTIP START --- */}
            {/* Muncul hanya saat bar di-hover (group-hover/progress) */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover/progress:opacity-100 group-hover/progress:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
              <div className="font-semibold">{progressPercentage}%</div>
              <div className="text-gray-300">{status}</div>

              {/* Panah kecil di bawah tooltip */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
            {/* --- CUSTOM TOOLTIP END --- */}
          </div>
        </div>

        {/* Tanggal Created */}
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {formatDate(created_at)}
        </span>
      </div>
    </div>
  );
};
