// import useSWR from "swr";
// import { DashboardData } from "@/types/common";
// import { useUser } from "./useUser";

// // Fetcher function tetap sama
// TIDAK PERLU LAGI
// const fetcher = async (url: string): Promise<DashboardData> => {
//   const res = await fetch(url);
//   if (!res.ok) {
//     const error = new Error("An error occurred while fetching the data.");
//     const errorInfo = await res.json();
//     (error as any).info = errorInfo;
//     (error as any).status = res.status;
//     throw error;
//   }
//   return res.json();
// };

// interface UseDashboardProps {
//   year?: number | null;
//   branchId?: string | number | null; INI TIDAK PERLU LAGI
//   specialistId?: string | null;
// }

// export function useDashboard({
//   year,
//   branchId,
//   specialistId,
// }: UseDashboardProps = {}) {
//   const params = new URLSearchParams();
//   if (year) params.append("year", year.toString());
//   if (branchId) params.append("branch_id", branchId.toString());
//   // if (specialistId) params.append("ls_id", specialistId.toString());

//   const queryString = params.toString();
//   const apiUrl = `/api/dashboard${queryString ? `?${queryString}` : ""}`;

//   const { data, error, isLoading } = useSWR<DashboardData>(apiUrl, fetcher);

//   return {
//     dashboardData: data,
//     isLoading,
//     isError: !!error,
//   };
// }

// hooks/useDashboard.ts
import useSWR from "swr";
import { DashboardData } from "@/types/common";
import { useUser } from "./useUser";

interface UseDashboardProps {
  year?: number | null;
  specialistId?: string | null;
}

export function useDashboard({ year, specialistId }: UseDashboardProps = {}) {
  const { user } = useUser();

  const { data, error, isLoading } = useSWR<DashboardData>(() => {
    // Penjaga Gerbang: Tunggu sampai user dan branch_id ada.
    if (!user || !user.branch_id) {
      return null;
    }

    // Jika sudah aman, baru buat dan kembalikan URL.
    const params = new URLSearchParams();
    if (year) params.append("year", year.toString());
    params.append("branch_id", user.branch_id);
    
    // Jika perlu filter specialist di masa depan, logikanya di sini
    if (specialistId && user.position_nama === 'Location Manager') {
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