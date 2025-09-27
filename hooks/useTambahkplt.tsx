import useSWR from "swr";
import { PrefillKpltResponse } from "@/types/common";
import { useEffect } from "react";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.error || "An error occurred while fetching data."
    );
  }
  return res.json();
};

export function useTambahKplt(ulokId: string | null | undefined) {
  const apiUrl = ulokId ? `/api/ulok/${ulokId}/kplt/prefill` : null;

  const { data, error, isLoading } = useSWR<PrefillKpltResponse>(
    apiUrl,
    fetcher
  );

  useEffect(() => {
    if (data) {
      console.log("Prefill response:", data);
    }
  }, [data]);

  return {
    data,
    isLoading,
    error,
  };
}
