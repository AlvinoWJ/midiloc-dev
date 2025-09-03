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

type Ulok = {
  id: string;
  nama_ulok: string;
  alamat: string;
  created_at: string;
  approval_status: string;
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
      } catch (err) {
        console.error("Fetch error:", err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

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

  const filteredUlok = ulokData.filter((ulok) => {
    // Search
    const matchSearch =
      ulok.nama_ulok.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ulok.alamat.toLowerCase().includes(searchQuery.toLowerCase());

    // Ambil bulan & tahun dari created_at
    const date = new Date(ulok.created_at);
    const ulokMonth = (date.getMonth() + 1).toString().padStart(2, "0"); // "01"-"12"
    const ulokYear = date.getFullYear().toString();

    // Langsung bandingkan karena value bulan di dropdown sudah "01", "02", dst
    const matchMonth = filterMonth ? ulokMonth === filterMonth : true;
    const matchYear = filterYear ? ulokYear === filterYear : true;

    return matchSearch && matchMonth && matchYear;
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
              onTabChange={(tab) => console.log(tab)}
            />
            <AddButton onClick={() => router.push("/usulan_lokasi/tambah")} />
          </div>

          {/* Info Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : isError ? (
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
        </main>
      </div>
    </div>
  );
}
