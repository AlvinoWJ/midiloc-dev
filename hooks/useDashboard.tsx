import useSWR from "swr";
import { DashboardData } from "@/types/common";

// Fetcher function tetap sama
const fetcher = async (url: string): Promise<DashboardData> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    const errorInfo = await res.json();
    (error as any).info = errorInfo;
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
};

interface UseDashboardProps {
  year?: number | null;
  branchId?: string | number | null; // optional: tetap didukung kalau perlu
  lsId?: string | null; // Location Specialist filter (UUID)
}

export function useDashboard({ year, branchId, lsId }: UseDashboardProps = {}) {
  const params = new URLSearchParams();
  if (year) params.append("year", year.toString());
  if (branchId) params.append("branch_id", branchId.toString());
  if (lsId) params.append("ls_id", lsId.toString()); // tambahkan ls_id ke query

  const queryString = params.toString();
  const apiUrl = `/api/dashboard${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading } = useSWR<DashboardData>(apiUrl, fetcher);

  return {
    dashboardData: data,
    isLoading,
    isError: !!error,
  };
}
