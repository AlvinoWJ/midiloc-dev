"use client";

import { useParams } from "next/navigation";
import { useTambahKplt } from "@/hooks/useTambahkplt";
import SWRProvider from "@/app/swr-provider";
import TambahKpltLayout from "@/components/desktop/tambah-kplt-layout";
import { mapKpltRowToMappedData } from "@/hooks/useKpltDetail";

export default function TambahkpltPageWrapper() {
  return (
    <SWRProvider>
      <TambahKpltPage />
    </SWRProvider>
  );
}

function TambahKpltPage() {
  const params = useParams<{ id: string }>();
  const ulokId = params?.id || "";

  const { data, isLoading, error } = useTambahKplt(ulokId);

  // mapping data disini
  const mappedData = mapKpltRowToMappedData(data);

  return (
    <TambahKpltLayout
      isLoading={isLoading}
      error={error || null}
      data={mappedData} // sudah mapped
      ulokId={ulokId}
    />
  );
}
