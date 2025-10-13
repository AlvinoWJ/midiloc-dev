"use client";

import { UlokPageProps } from "@/types/common";
import { InfoCard } from "@/components/ui/infocard"; // Gunakan satu InfoCard yang responsif
import AddButton from "@/components/ui/addbutton"; // Gunakan satu AddButton yang responsif
import Tabs from "@/components/ui/tabs"; // Gunakan satu komponen Tabs yang responsif
import SearchWithFilter from "@/components/ui/searchwithfilter"; // Gunakan satu Search yang responsif
import { UlokPageSkeleton } from "@/components/ui/skleton"; // Gunakan satu Skeleton yang responsif
import { useRouter } from "next/navigation";

export default function UlokLayout(props: UlokPageProps) {
  const router = useRouter();

  // Props ini sama untuk kedua platform, jadi tidak ada perubahan di sini
  const {
    isLoading,
    isError,
    activeTab,
    filteredUlok,
    searchQuery,
    filterMonth,
    filterYear,
    isLocationSpecialist,
    onSearch,
    onFilterChange,
    onTabChange,
  } = props;

  // Render Skeleton atau Error state jika diperlukan
  if (isLoading) {
    return <UlokPageSkeleton />; // Diasumsikan komponen ini sudah responsif
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
        <div className="bg-white rounded-lg shadow-sm border p-6 lg:p-8 max-w-md">
          <div className="text-red-500 text-5xl lg:text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Gagal Memuat Data
          </h3>
          <p className="text-gray-600 text-sm lg:text-base mb-4">
            Terjadi kesalahan saat mengambil data. Silakan coba lagi.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors w-full lg:w-auto"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  // Render konten utama
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header: Judul dan Search/Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-2xl lg:text-4xl font-bold">Usulan Lokasi</h1>
        <SearchWithFilter onSearch={onSearch} onFilterChange={onFilterChange} />
      </div>

      {/* Kontrol: Tabs dan Tombol Tambah */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <Tabs
          tabs={["Recent", "History"]}
          onTabChange={onTabChange}
          activeTab={activeTab}
        />
        {isLocationSpecialist() && (
          <AddButton onClick={() => router.push("/usulan_lokasi/tambah")} />
        )}
      </div>

      {/* Konten Grid / List */}
      {filteredUlok.length === 0 ? (
        // Tampilan "Data Kosong"
        <div className="flex flex-col items-center justify-center text-center py-16 px-4">
          <div className="text-gray-300 text-6xl mb-4">📍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || filterMonth || filterYear
              ? "Tidak ada data yang cocok"
              : "Belum ada data ulok"}
          </h3>
          <p className="text-gray-500 text-sm lg:text-base max-w-md">
            {searchQuery || filterMonth || filterYear
              ? "Coba ubah kata kunci pencarian atau filter Anda."
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
                className="mt-6 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors w-full max-w-xs lg:w-auto"
              >
                Tambah Usulan Lokasi
              </button>
            )}
        </div>
      ) : (
        // Tampilan Kartu Data
        // Di mobile akan menjadi list (space-y-4), di desktop menjadi grid
        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6">
          {filteredUlok.map((ulok) => (
            <InfoCard
              key={ulok.id}
              id={ulok.id}
              nama={ulok.nama_ulok}
              alamat={ulok.alamat}
              created_at={ulok.created_at}
              status={ulok.approval_status}
              detailPath="/usulan_lokasi/detail"
            />
          ))}
        </div>
      )}
    </div>
  );
}
