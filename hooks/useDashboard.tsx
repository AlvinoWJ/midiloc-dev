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
    if (!user || !user.branch_id) {
      return null;
    }

    // Jika sudah aman, baru buat dan kembalikan URL.
    const params = new URLSearchParams();
    if (year) params.append("year", year.toString());
    params.append("branch_id", user.branch_id);

    // Jika perlu filter specialist di masa depan, logikanya di sini
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
