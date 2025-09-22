"use client";

import useSWR from "swr";

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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUser() {
  // Key '/api/me' akan dicache global oleh SWR
  const { data, error, isLoading, mutate } = useSWR<ApiMeResponse>(
    "/api/me",
    fetcher
  );

  return {
    user: data?.user ?? null,
    loadingUser: isLoading,
    userError: error,
    refreshUser: () => mutate(),
    // Optimistic local update (misal update display name)
    updateUserLocal: (partial: Partial<NonNullable<AppUser>>) =>
      mutate((current) => {
        const prevUser = current?.user;
        if (!prevUser || !prevUser.id) return current; // do not update if no user or id
        return {
          user: { ...prevUser, ...partial, id: prevUser.id },
        };
      }, false),
  };
}
