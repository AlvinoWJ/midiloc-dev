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
  ulokEksternal: () => mutate(swrKeys.ulokEksternal),
  ulokEksternalDetail: (id: string) => mutate(swrKeys.ulokEksternalDetail(id)),
  kplt: () => mutate(swrKeys.kplt),
  kpltDetail: (id: string) => mutate(swrKeys.kpltDetail(id)),
};
