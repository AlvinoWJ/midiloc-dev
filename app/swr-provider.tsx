"use client";

import { SWRConfig } from "swr";

export default function SWRProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SWRConfig
      value={{
        fetcher: async (url: string) => {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Fetch error (${res.status}): ${text}`);
          }
          return res.json();
        },
        dedupingInterval: 60_000, // 1 menit: panggilan berulang dalam interval ini tidak fetch ulang
        revalidateOnFocus: false, // tidak refetch saat tab fokus
        revalidateIfStale: false,
        revalidateOnReconnect: false,
        errorRetryCount: 1,
      }}
    >
      {children}
    </SWRConfig>
  );
}
