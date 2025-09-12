"use client";

import { useSidebar } from "@/components/ui/sidebarcontext";
import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";
import { InfoCard } from "@/components/infocard";
import Tabs from "@/components/ui/tabs";
import AddButton from "@/components/ui/addbutton";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SearchWithFilter from "@/components/searchwithfilter";
import { UlokCardsSkeleton, UlokPageSkeleton } from "@/components/skleton";

type Ulok = {
  id: string;
  nama_ulok: string;
  alamat: string;
  created_at: string;
  approval_status: string;
};

type CurrentUser = {
  id: string;
  email: string | null;
  nama: string | null;
  branch_id: string | null;
  branch_nama: string | null;
  position_id: string | null;
  position_nama: string | null;
};

export default function UlokPage() {
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const [ulokData, setUlokData] = useState<Ulok[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [activeTab, setActiveTab] = useState("Recent");
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const fetchUlok = async () => {
      try {
        setIsLoading(true);
        setIsError(false);

        const res = await fetch("http://localhost:3000/api/ulok");
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error(
              "Akses ditolak: hanya role Location Specialist yang dapat melihat data ini."
            );
          } else {
            throw new Error(`Gagal mengambil data ulok (Error ${res.status})`);
          }
        }

        const data = await res.json();
        setUlokData(data.data);
        setUser(data.meta.user);
      } catch (err) {
        console.error("Fetch error:", err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    // fetchUserData();
    fetchUlok();
  }, []);

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
          {isLoading ? (
            <UlokPageSkeleton cardCount={6} />
          ) : isError ? (
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

              {/* Info Card atau Empty State */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUlok.length === 0 ? (
                  // Empty State yang lebih menarik
                  <div className="col-span-full flex flex-col items-center justify-center py-16">
                    <div className="text-gray-300 text-6xl mb-4">📍</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchQuery || filterMonth || filterYear
                        ? "Tidak ada data yang cocok"
                        : "Belum ada data ulok"}
                    </h3>
                    <p className="text-gray-500 text-center max-w-md">
                      {searchQuery || filterMonth || filterYear
                        ? "Coba ubah kata kunci pencarian atau filter untuk menemukan data yang Anda cari."
                        : activeTab === "Recent"
                        ? "Mulai dengan menambahkan usulan lokasi baru."
                        : "Belum ada data riwayat usulan lokasi."}
                    </p>
                    {isLocationSpecialist() &&
                      !searchQuery &&
                      !filterMonth &&
                      !filterYear &&
                      activeTab === "Recent" && (
                        <button
                          onClick={() => router.push("/usulan_lokasi/tambah")}
                          className="mt-4 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Tambah Usulan Lokasi
                        </button>
                      )}
                  </div>
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
