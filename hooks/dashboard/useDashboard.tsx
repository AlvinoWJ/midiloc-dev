import useSWR from "swr";
import { DashboardData } from "@/types/common";
import { useUser } from "../useUser";

interface UseDashboardProps {
  year?: number | null;
  specialistId?: string | null;
  branchId?: string | null;
}

export function useDashboard({
  year,
  specialistId,
  branchId,
}: UseDashboardProps = {}) {
  const { user } = useUser();

  const { data, error, isLoading } = useSWR<DashboardData>(() => {
    if (!user || !user.branch_id) {
      return null;
    }

    const params = new URLSearchParams();
    if (year) {
      params.append("year", year.toString());
    }

    if (branchId) {
      params.append("branch_id", branchId);
    }

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
