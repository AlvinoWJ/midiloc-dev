import { mutate } from "swr";
import { swrKeys } from "@/lib/swr-keys";

export const invalidate = {
  me: () => mutate(swrKeys.me),
  ulok: () =>
    mutate(
      (key) => typeof key === "string" && key.includes("/api/ulok"),
      undefined,
      { revalidate: true }
    ),
  ulokDetail: (id: string) => mutate(swrKeys.ulokDetail(id)),
  ulokEksternal: () =>
    mutate(
      (key) => typeof key === "string" && key.includes("/api/ulok_eksternal"),
      undefined,
      { revalidate: true }
    ),

  ulokEksternalDetail: (id: string) => mutate(swrKeys.ulokEksternalDetail(id)),
  kplt: () =>
    mutate(
      (key) => typeof key === "string" && key.includes("/api/kplt"),
      undefined,
      { revalidate: true }
    ),
  kpltDetail: (id: string) => mutate(swrKeys.kpltDetail(id)),
  tokoEksisting: () =>
    mutate(
      (key) => typeof key === "string" && key.includes("/api/ulok_eksisting"),
      undefined,
      { revalidate: true }
    ),
  tokoExistingDetail: (id: string) => mutate(swrKeys.tokoExistingDetail(id)),
};
