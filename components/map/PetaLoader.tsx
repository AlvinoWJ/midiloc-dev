// components/map/PetaLoader.tsx
"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Properti } from "@/types/common";

// Tambahkan 'centerPoint' ke props di sini juga
interface PetaLoaderProps {
  data: Properti[];
  centerPoint?: [number, number];
  showPopup?: boolean;
}

export default function PetaLoader({
  data,
  centerPoint,
  showPopup,
}: PetaLoaderProps) {
  const PetaLokasiInteraktif = useMemo(
    () =>
      dynamic(() => import("@/components/map/PetaLokasiInteraktif"), {
        ssr: false,
        loading: () => (
          <p className="h-full w-full flex items-center justify-center bg-gray-200 rounded-lg">
            Memuat Peta...
          </p>
        ),
      }),
    []
  );

  // Teruskan (pass down) prop 'centerPoint' ke komponen peta
  return (
    <PetaLokasiInteraktif
      data={data}
      centerPoint={centerPoint}
      showPopup={showPopup}
    />
  );
}
