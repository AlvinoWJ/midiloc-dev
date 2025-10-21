// hooks/useMap.ts
"use client";

import useSWR from "swr";
import { useUser } from "./useUser";
import { ApiKpltResponse, KpltExisting, Properti, UlokForKplt } from "../types/common";

interface MapApiResponse {
  success: boolean;
  data: Properti[];
  pagination?: any;
}

export function useMap(specialistId: string | null) {
  const { user } = useUser();

  const { data: ulokResponse, error: ulokError, isLoading: isUlokLoading } = 
    useSWR<MapApiResponse>(() => {
      if (!user) return null;
      const role = user.position_nama?.toLowerCase().trim();

      if (role === 'location specialist' && user.id) {
        return `/api/ulok?user_id=${user.id}&for_map=true`;
      }
      if ((role === 'location manager' || role === 'branch manager') && user.branch_id) {
        // --- INI PERBAIKAN UTAMANYA ---
        // Jika specialistId adalah null, anggap sebagai "semua".
        const specialistFilter = specialistId ?? "semua"; 
        return `/api/ulok?branch_id=${user.branch_id}&specialist_id=${specialistFilter}&for_map=true`;
      }
      return null;
    });
    
  const { data: kpltResponse, error: kpltError, isLoading: isKpltLoading } = 
    useSWR<ApiKpltResponse>(() => {
      if (!user) return null;
      const role = user.position_nama?.toLowerCase().trim();

      if (role === 'location specialist' && user.id) {
        return `/api/kplt?user_id=${user.id}&for_map=true`;
      }
      if ((role === 'location manager' || role === 'branch manager') && user.branch_id) {
        // --- TERAPKAN PERBAIKAN YANG SAMA DI SINI ---
        const specialistFilter = specialistId ?? "semua";
        return `/api/kplt?branch_id=${user.branch_id}&specialist_id=${specialistFilter}&for_map=true`;
      }
      return null;
    });

  const ulokData = ulokResponse?.data || [];
  // const kpltData = kpltResponse || [];
  
  // const combinedKpltData: (KpltExisting | UlokForKplt)[] = [
  //   ...(kpltResponse?.kplt_existing || []),
  //   ...(kpltResponse?.kplt_from_ulok_ok || [])
  // ];

  // // 2. Petakan array gabungan menjadi format 'Properti' yang seragam dan LENGKAP
  // const kpltData: Properti[] = combinedKpltData.map((item) => {
  //   const isExisting = 'kplt_approval' in item;

  //   // Pastikan semua properti dari 'Properti' ada di sini
  //   return {
  //     id: item.id,
  //     latitude: item.latitude,
  //     longitude: item.longitude,
  //     alamat: item.alamat,
  //     created_at: item.created_at,
  //     ulok_id: item.ulok_id,
      
  //     // Properti yang berbeda, dipilih berdasarkan tipe
  //     approval_status: isExisting ? item.kplt_approval : item.ui_status,
  //     nama: isExisting ? item.nama_kplt : item.nama_ulok,
      
  //     // Properti yang hilang dan menjadi penyebab error
  //     type: 'kplt', // <-- PERBAIKAN: Wajib tambahkan 'type'
  //   };
  // });

 // 1. Proses "kplt_existing" (Warga Lama)
  const mappedKpltExisting: Properti[] = (kpltResponse?.kplt_existing || []).map(item => ({
    id: item.id, // ID-nya adalah 'id'
    latitude: item.latitude,
    longitude: item.longitude,
    nama: item.nama_kplt,
    alamat: item.alamat,
    approval_status: item.kplt_approval,
    created_at: item.created_at,
    ulok_id: item.ulok_id,
    type: 'kplt',
  }));

  // 2. Proses "kplt_from_ulok_ok" (Warga Baru)
  const mappedUlokForKplt: Properti[] = (kpltResponse?.kplt_from_ulok_ok || []).map(item => ({
    // PERBAIKAN: Gunakan 'ulok_id' sebagai 'id' untuk tipe data ini
    id: item.id, 
    latitude: item.latitude,
    longitude: item.longitude,
    nama: item.nama_ulok,
    alamat: item.alamat,
    approval_status: item.ui_status,
    created_at: item.created_at,
    ulok_id: item.ulok_id,
    type: 'kplt',
  }));

  // 3. Gabungkan kedua array yang sudah memiliki ID yang benar
  const kpltData: Properti[] = [...mappedKpltExisting, ...mappedUlokForKplt];
  return {
    ulokUntukPeta: ulokData,
    kpltUntukPeta: kpltData,
    isMapLoading: isUlokLoading || isKpltLoading,
    mapError: ulokError || kpltError,
  };
}