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
        // Biarkan browser pakai HTTP cache normal (hapus no-store),
        // agar conditional GET (ETag) bisa 304 dan hemat.
        fetcher: async (url: string) => {
          const res = await fetch(url, { credentials: "include" });
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Fetch error (${res.status}): ${text}`);
          }
          return res.json();
        },
        provider: () => new Map(),
        dedupingInterval: 60_000,
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnReconnect: false,
        errorRetryCount: 1,
      }}
    >
      {children}
    </SWRConfig>
  );
}
