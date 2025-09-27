"use client";

import React, { useState } from "react";
import Sidebar from "@/components/desktop/sidebar";
import Navbar from "@/components/desktop/navbar";
import { useSidebar } from "@/hooks/useSidebar";
import { MappedKpltData } from "@/hooks/useKpltDetail";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";

// Import ikon yang dibutuhkan
import {
  ChevronDownIcon,
  MapPinIcon, // Untuk Data Usulan Lokasi
  BuildingStorefrontIcon, // Untuk Data Store
  UserIcon, // Untuk Data Pemilik
  DocumentTextIcon, // Untuk Form Kelengkapan (jika ada)
} from "@heroicons/react/24/solid";

// --- Interface Props (Tidak ada perubahan) ---
interface TambahKpltLayoutProps {
  isLoading: boolean;
  error: Error | null;
  data: MappedKpltData | undefined;
  ulokId: string;
}

// --- Komponen Skeleton (Tidak ada perubahan) ---
const TambahKpltSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 w-1/3 bg-gray-200 rounded-md mb-6"></div>
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="h-6 w-3/4 bg-gray-200 rounded-md"></div>
      <div className="h-4 w-1/2 bg-gray-200 rounded-md mt-2"></div>
      <div className="h-4 w-1/3 bg-gray-200 rounded-md mt-4"></div>
    </div>
  </div>
);

// --- Komponen DetailField (Tidak ada perubahan) ---
const DetailField = ({ label, value }: { label: string; value: any }) => (
  <div>
    <label className="text-gray-600 font-medium text-sm mb-1 block">
      {label}
    </label>
    <div className="text-gray-900 py-2 text-sm bg-gray-100 rounded-lg px-3 min-h-[40px] flex items-center w-full break-words">
      {value || "-"}
    </div>
  </div>
);

// --- Komponen FileLink untuk menampilkan link file ---
const FileLink = ({ label, url }: { label: string; url: string | null }) => {
  if (!url) return null;
  return (
    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
      <span className="text-sm text-gray-700">{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-10 inline-flex items-center bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg"
      >
        <LinkIcon className="w-3 h-3 mr-1.5" />
        Lihat
      </a>
    </div>
  );
};

// --- Komponen UTAMA dengan Logika Expand/Collapse dan Ikon ---
export default function TambahKpltLayout({
  isLoading,
  error,
  data,
  ulokId,
}: TambahKpltLayoutProps) {
  if (data) {
    console.log("Data diterima:", data);
    console.log("URL File Intip:", data.fileIntip);
    console.log("URL Form ULOK:", data.formUlok);
  }
  const { isCollapsed } = useSidebar();
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <div
          className={`flex-1 flex flex-col bg-gray-50 min-h-screen transition-all duration-300 ${
            isCollapsed ? "ml-[80px]" : "ml-[270px]"
          }`}
        >
          <Navbar />
          <main className="flex-1 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <TambahKpltSkeleton />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col bg-gray-100 min-h-screen transition-all duration-300 ${
          isCollapsed ? "ml-[80px]" : "ml-[270px]"
        }`}
      >
        <Navbar />
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                ...
              </div>
            ) : !data ? (
              <div>Data untuk ULOK ID {ulokId} tidak ditemukan.</div>
            ) : (
              <div>
                <Button
                  onClick={() => router.back()}
                  variant="back"
                  className="mb-6 bg-white"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Kembali
                </Button>

                <div className="bg-white rounded-xl shadow-md transition-all duration-500">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center">
                      <div className="flex-1 min-w-0 pr-4">
                        <h1 className="text-xl font-bold text-gray-800">
                          {data.namaKplt}
                        </h1>
                        <p className="text-lg text-gray-500 mt-1">
                          {data.alamat}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`transition-[max-height] duration-700 ease-in-out overflow-hidden ${
                      isExpanded ? "max-h-[2000px]" : "max-h-0"
                    }`}
                  >
                    <div className="px-6 pb-6">
                      <div className="space-y-6">
                        {/* --- DATA USULAN LOKASI --- */}
                        <div className="border-t border-gray-300 pt-5">
                          <h4 className="flex items-center text-base font-semibold text-gray-700 mb-3">
                            <MapPinIcon className="w-5 h-5 mr-2 text-red-500" />{" "}
                            Data Usulan Lokasi
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailField
                              label="Provinsi"
                              value={data.provinsi}
                            />
                            <DetailField
                              label="Kabupaten/Kota"
                              value={data.kabupaten}
                            />
                            <DetailField
                              label="Kecamatan"
                              value={data.kecamatan}
                            />
                            <DetailField
                              label="Kelurahan/Desa"
                              value={data.desa}
                            />
                            <DetailField
                              label="Lat/Long"
                              value={`${data.latitude}, ${data.longitude}`}
                            />
                          </div>
                        </div>

                        {/* --- DATA STORE --- */}
                        <div className="border-t border-gray-300 pt-5">
                          <h4 className="flex items-center text-base font-semibold text-gray-700 mb-3">
                            <BuildingStorefrontIcon className="w-5 h-5 mr-2 text-blue-500" />{" "}
                            Data Store
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailField
                              label="Format Store"
                              value={data.formatStore}
                            />
                            <DetailField
                              label="Bentuk Objek"
                              value={data.bentukObjek}
                            />
                            <DetailField
                              label="Alas Hak"
                              value={data.alasHak}
                            />
                            <DetailField
                              label="Jumlah Lantai"
                              value={data.jumlahLantai}
                            />
                            <DetailField
                              label="Panjang"
                              value={<>{data.panjang} m</>}
                            />
                            <DetailField
                              label="Lebar Depan"
                              value={<>{data.lebarDepan} m</>}
                            />
                            <DetailField
                              label="Luas"
                              value={
                                <>
                                  {data.luas.toLocaleString("id-ID")} m
                                  <sup>2</sup>
                                </>
                              }
                            />
                            <DetailField
                              label="Harga Sewa (+PPN 10%)"
                              value={`Rp ${data.hargaSewa.toLocaleString(
                                "id-ID"
                              )}`}
                            />
                          </div>
                        </div>

                        {/* --- DATA PEMILIK --- */}
                        <div className="border-t border-gray-300 pt-5">
                          <h4 className="flex items-center text-base font-semibold text-gray-700 mb-3">
                            <UserIcon className="w-5 h-5 mr-2 text-green-500" />{" "}
                            Data Pemilik
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailField
                              label="Nama Pemilik"
                              value={data.pemilik}
                            />
                            <DetailField
                              label="Kontak Pemilik"
                              value={data.kontakPemilik}
                            />
                          </div>
                        </div>

                        {/* --- FORM KELENGKAPAN --- */}
                        <div className="border-t border-gray-300  pt-5">
                          <h4 className="flex items-center text-base font-semibold text-gray-700 mb-3">
                            <DocumentTextIcon className="w-5 h-5 mr-2 text-purple-500" />{" "}
                            Form Kelengkapan
                          </h4>
                          <div className="space-y-4">
                            <FileLink label="File Intip" url={data.fileIntip} />
                            <FileLink label="Form ULOK" url={data.formUlok} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Toggle Expand/Collapse */}
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`p-2 w-full text-gray-500 rounded-b-xl hover:bg-gray-50 focus-visible:bg-gray-100 transition-colors`}
                    aria-expanded={isExpanded}
                  >
                    <ChevronDownIcon
                      className={`w-6 h-6 mx-auto transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
