// hooks/useDashboard.ts

import useSWR from "swr";

// 1. Definisikan Tipe Data sesuai JSON response
interface KpiData {
  total_kplt: number;
  total_ulok: number;
  total_kplt_approves: number;
  total_ulok_approves: number;
  presentase_kplt_approves: number;
  presentase_ulok_approves: number;
}

interface FilterData {
  year: number | null;
  branch_id: string;
  branch_name: string;
}

interface DonutChartItem {
  count: number;
  label: string;
  status: string;
  percentage: number;
}

interface MonthlyDataItem {
  bulan: string;
  month_start: string;
  // Ini akan berisi salah satu dari dua di bawah, tergantung konteks
  total_kplt?: number;
  kplt_approves?: number;
  total_ulok?: number;
  ulok_approves?: number;
}

// Tipe utama yang mencakup semuanya
export interface DashboardData {
  kpis: KpiData;
  filters: FilterData;
  donut_kplt: DonutChartItem[];
  donut_ulok: DonutChartItem[];
  perbulan_kplt: MonthlyDataItem[];
  perbulan_ulok: MonthlyDataItem[];
  // Data percabang bisa ditambahkan di sini jika akan digunakan
  // percabang_kplt: any[];
  // percabang_ulok: any[];
}

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
  branchId?: string | number | null;
}

export function useDashboard({ year, branchId }: UseDashboardProps = {}) {
  const params = new URLSearchParams();
  if (year) params.append("year", year.toString());
  if (branchId) params.append("branch_id", branchId.toString());

  const queryString = params.toString();
  // 2. Sesuaikan URL API
  const apiUrl = `/api/dashboard/${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading } = useSWR<DashboardData>(apiUrl, fetcher);

  return {
    dashboardData: data,
    isLoading,
    isError: error,
  };
}
