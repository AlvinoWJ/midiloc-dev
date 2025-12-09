import useSWR from "swr";
import { DashboardData } from "@/types/common";
import { useUser } from "../useUser";

/**
 * UseDashboardProps
 * -----------------
 * Properti opsional untuk mengontrol data yang akan diambil:
 *
 * - year: Filter tahun laporan dashboard
 * - specialistId: ID spesialis (hanya digunakan oleh Location Manager)
 * - branchId: Filter berdasarkan ID cabang
 */
interface UseDashboardProps {
  year?: number | null;
  specialistId?: string | null;
  branchId?: string | null;
}

/**
 * useDashboard Hook
 * -----------------
 * Hook untuk mengambil data dashboard berdasarkan role user,
 * tahun, cabang, atau spesialis tertentu.
 *
 * Fitur Utama:
 * - Mengambil data dashboard menggunakan SWR (client-side fetching)
 * - Query otomatis disusun berdasarkan props & hak akses pengguna
 * - Menghindari request jika user belum tersedia atau tidak memiliki branch_id
 *
 * Alur:
 * 1. Ambil data user dari `useUser()`
 * 2. Jika user belum siap → SWR tidak melakukan fetching (return null)
 * 3. Generate query params berdasarkan:
 *    - year
 *    - branchId
 *    - specialistId (hanya jika user adalah Location Manager)
 * 4. Return hasil SWR: data, loading, dan error
 *
 * Contoh Penggunaan:
 * ------------------
 * const { dashboardData, isLoading, isError } = useDashboard({
 *   year: 2025,
 *   branchId: "123",
 * });
 *
 * Jika dipanggil tanpa parameter:
 * const { dashboardData } = useDashboard();
 */
export function useDashboard({
  year,
  specialistId,
  branchId,
}: UseDashboardProps = {}) {
  // Ambil informasi user (termasuk role & branch)
  const { user } = useUser();

  /**
   * SWR Fetching
   * ------------
   * Key SWR akan berupa:
   * `/api/dashboard?year=2025&branch_id=xx&ls_id=yy`
   *
   * Jika return null → SWR tidak melakukan request sama sekali.
   */
  const { data, error, isLoading } = useSWR<DashboardData>(() => {
    // Pastikan user telah siap & memiliki branch
    if (!user || !user.branch_id) {
      return null;
    }

    // Build query params
    const params = new URLSearchParams();

    if (year) {
      params.append("year", year.toString());
    }

    if (branchId) {
      params.append("branch_id", branchId);
    }

    // Untuk specialistId, hanya Location Manager yang boleh filter
    if (specialistId && user.position_nama === "Location Manager") {
      params.append("ls_id", specialistId);
    }

    const queryString = params.toString();
    return `/api/dashboard?${queryString}`;
  });

  return {
    dashboardData: data,
    isLoading,
    isError: !!error,
  };
}
