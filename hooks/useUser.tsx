"use client";

import useSWR, { mutate as globalMutate } from "swr";

export type AppUser = {
  id: string;
  email?: string | null;
  nama?: string | null;
  branch_id?: string | null;
  branch_nama?: string | null;
  position_id?: string | null;
  position_nama?: string | null;
} | null;

interface ApiMeResponse {
  user: AppUser;
}

export function useUser() {
  // Pakai global fetcher dari SWRProvider, dan revalidate saat mount
  const { data, error, isLoading, mutate } = useSWR<ApiMeResponse>(
    "/api/me",
    (url: string) => fetch(url).then((res) => res.json()),
    { revalidateOnMount: true }
  );

  return {
    user: data?.user ?? null,
    loadingUser: isLoading,
    userError: error,

    // Revalidate sekarang
    refreshUser: () => mutate(),

    setUserCache: (user: NonNullable<AppUser>) =>
      globalMutate("/api/me", { user }, false),

    // Clear cache user (gunakan saat logout)
    clearUserCache: () => globalMutate("/api/me", { user: null }, false),

    // Optimistic local update
    updateUserLocal: (partial: Partial<NonNullable<AppUser>>) =>
      mutate((current) => {
        const prevUser = current?.user;
        if (!prevUser || !prevUser.id) return current;
        return { user: { ...prevUser, ...partial, id: prevUser.id } };
      }, false),
  };
}
