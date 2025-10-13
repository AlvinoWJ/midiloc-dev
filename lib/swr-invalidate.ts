import { mutate } from "swr";
import { swrKeys } from "@/lib/swr-keys";

export const invalidate = {
  me: () => mutate(swrKeys.me),
  ulok: () => mutate(swrKeys.ulok),
  ulokDetail: (id: string) => mutate(swrKeys.ulokDetail(id)),
  kplt: () => mutate(swrKeys.kplt),
  kpltDetail: (id: string) => mutate(swrKeys.kpltDetail(id)),
};
