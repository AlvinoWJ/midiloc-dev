"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";
import DetailUlok from "@/components/detailulok";
import { useSidebar } from "@/components/ui/sidebarcontext";

interface UlokDataForUI {
  id: string;
  namaUlok: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  kelurahan: string;
  alamat: string;
  latlong: string;
  tanggalUlok: string;
  formatStore: string;
  bentukObjek: string;
  alasHak: string;
  jumlahlantai: string;
  lebardepan: string;
  panjang: string;
  luas: string;
  hargasewa: string;
  namapemilik: string;
  kontakpemilik: string;
}

export default function DetailPage() {
  const { isCollapsed } = useSidebar();
  const { id } = useParams<{ id: string }>();

  const [ulokData, setUlokData] = useState<UlokDataForUI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setErrorMessage("ID tidak ditemukan di URL.");
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/ulok/${id}`);
        if (!response.ok) {
          throw new Error(`Gagal mengambil data (Status: ${response.status})`);
        }

        const jsonResponse = await response.json();
        const apiData = jsonResponse.data?.[0];

        if (!apiData) {
          throw new Error("Data tidak ditemukan dalam respons API.");
        }

        setUlokData({
          id: apiData.id,
          namaUlok: apiData.nama_ulok,
          provinsi: apiData.provinsi,
          kabupaten: apiData.kabupaten,
          kecamatan: apiData.kecamatan,
          kelurahan: apiData.desa_kelurahan,
          alamat: apiData.alamat,
          latlong: `${apiData.latitude}, ${apiData.longitude}`,
          tanggalUlok: apiData.created_at,
          formatStore: apiData.format_store,
          bentukObjek: apiData.bentuk_objek,
          alasHak: String(apiData.alas_hak),
          jumlahlantai: String(apiData.jumlah_lantai),
          lebardepan: String(apiData.lebar_depan),
          panjang: String(apiData.panjang),
          luas: String(apiData.luas),
          hargasewa: `Rp ${apiData.harga_sewa}`,
          namapemilik: apiData.nama_pemilik,
          kontakpemilik: apiData.kontak_pemilik,
        });
      } catch (err: any) {
        setErrorMessage(err.message || "Terjadi kesalahan tidak diketahui.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return (
    <div className="flex">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col bg-gray-50 min-h-screen transition-all duration-300 ${
          isCollapsed ? "pl-[80px]" : "pl-[270px]"
        }`}
      >
        <Navbar />
        <main className="flex-1">
          {isLoading && <p className="text-center">Loading data...</p>}
          {errorMessage && (
            <p className="text-center text-red-500">{errorMessage}</p>
          )}
          {ulokData && !isLoading && <DetailUlok initialData={ulokData} />}
        </main>
      </div>
    </div>
  );
}
