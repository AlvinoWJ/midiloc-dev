"use client";

import { useSidebar } from "@/components/ui/sidebarcontext";
import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";
import { InfoCard } from "@/components/infocard";
import Tabs from "@/components/ui/tabs";
import AddButton from "@/components/ui/addbutton";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SearchWithFilter from "@/components/searchwithfilter";
import { UlokPageSkeleton } from "@/components/skleton";
import SWRProvider from "@/app/swr-provider";
import { useUser } from "@/app/hooks/useUser";
import { useUlok } from "@/app/hooks/useUlok";

export default function UlokPageWrapper() {
  // Jika nanti SWRProvider sudah ada di layout global, cukup return <UlokPage />
  return (
    <SWRProvider>
      <UlokPage />
    </SWRProvider>
  );
}

export function UlokPage() {
  const { isCollapsed } = useSidebar();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [activeTab, setActiveTab] = useState("Recent");
  const { user } = useUser();
  const { ulokData, ulokLoading, ulokError } = useUlok();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const monthMap: Record<string, string> = {
    Januari: "01",
    Februari: "02",
    Maret: "03",
    April: "04",
    Mei: "05",
    Juni: "06",
    Juli: "07",
    Agustus: "08",
    September: "09",
    Oktober: "10",
    November: "11",
    Desember: "12",
  };

  const isLocationSpecialist = () => {
    return user?.position_nama?.trim().toLowerCase() === "location specialist";
  };

  const filteredUlok = ulokData
    .filter((ulok) => {
      const matchSearch =
        ulok.nama_ulok.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ulok.alamat.toLowerCase().includes(searchQuery.toLowerCase());
      const date = new Date(ulok.created_at);
      const ulokMonth = (date.getMonth() + 1).toString().padStart(2, "0"); // "01"-"12"
      const ulokYear = date.getFullYear().toString();
      const matchMonth = filterMonth ? ulokMonth === filterMonth : true;
      const matchYear = filterYear ? ulokYear === filterYear : true;

      return matchSearch && matchMonth && matchYear;
    })
    .filter((ulok) => {
      // Tambahkan filter kedua berdasarkan tab yang aktif
      if (activeTab === "Recent") {
        return ulok.approval_status === "In Progress";
      }
      if (activeTab === "History") {
        return ulok.approval_status === "OK" || ulok.approval_status === "NOK";
      }
      return true; // Default, jika ada tab lain
    });

  return (
    <div className="flex">
      <Sidebar />

      {/* Konten utama */}
      <div
        className={`flex-1 flex flex-col bg-gray-50 min-h-screen transition-all duration-300 ${
          isCollapsed ? "ml-[80px]" : "ml-[270px]"
        }`}
      >
        <Navbar />

        <main className="flex-1 p-6 space-y-6">
          {/* Jika loading, tampilkan skeleton dengan struktur exact sama */}
          {ulokLoading ? (
            <UlokPageSkeleton cardCount={6} />
          ) : ulokError ? (
            // Error State dengan design yang lebih baik
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="bg-white rounded-lg shadow-sm border p-8 max-w-md">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Gagal Memuat Data
                </h3>
                <p className="text-gray-600 mb-4">
                  Terjadi kesalahan saat mengambil data ulok. Silakan coba lagi.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Muat Ulang
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header atas */}
              <div className="flex items-center justify-between">
                <h1 className="mt-3 text-4xl font-bold mb-4">Usulan Lokasi</h1>
                <SearchWithFilter
                  onSearch={setSearchQuery}
                  onFilterChange={(month, year) => {
                    setFilterMonth(month);
                    setFilterYear(year);
                  }}
                />
              </div>

              {/* Tab Recent & History + Add */}
              <div className="flex items-center justify-between">
                <Tabs
                  tabs={["Recent", "History"]}
                  onTabChange={setActiveTab}
                  activeTab={activeTab}
                />
                {isLocationSpecialist() && (
                  <AddButton
                    onClick={() => router.push("/usulan_lokasi/tambah")}
                  />
                )}
              </div>

              {/* Info Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-6">
                {ulokLoading ? (
                  <p className="text-gray-500">Loading...</p>
                ) : ulokError ? (
                  <p className="text-red-500">Gagal memuat data.</p>
                ) : filteredUlok.length === 0 ? (
                  <p className="text-gray-500">Tidak ada data yang cocok.</p>
                ) : (
                  filteredUlok.map((ulok) => (
                    <InfoCard
                      key={ulok.id}
                      id={ulok.id}
                      nama_ulok={ulok.nama_ulok}
                      alamat={ulok.alamat}
                      created_at={ulok.created_at}
                      approval_status={ulok.approval_status}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
