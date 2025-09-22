import { UlokPageProps } from "@/types/common";
import Sidebar from "@/components/desktop/sidebar";
import Navbar from "@/components/desktop/navbar";
import { InfoCard } from "@/components/ui/infocard";
import DesktopTabs from "@/components/desktop/tabs";
import AddButton from "@/components/ui/addbutton";
import SearchWithFilter from "@/components/desktop/searchwithfilter";
import { UlokPageSkeleton } from "@/components/desktop/skleton";
import { useSidebar } from "@/hooks/useSidebar";
import { useRouter } from "next/navigation";

export default function DesktopUlokLayout(props: UlokPageProps) {
  const { isCollapsed } = useSidebar();
  const router = useRouter();
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

  return (
    <div className="flex">
      <Sidebar />

      <div
        className={`flex-1 flex flex-col bg-gray-50 min-h-screen transition-all duration-300 ${
          isCollapsed ? "ml-[80px]" : "ml-[270px]"
        }`}
      >
        <Navbar />

        <main className="flex-1 p-6 space-y-6">
          {isLoading ? (
            <UlokPageSkeleton cardCount={6} />
          ) : isError ? (
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
              {/* Header */}
              <div className="flex items-center justify-between">
                <h1 className="text-4xl font-bold">Usulan Lokasi</h1>
                <SearchWithFilter
                  onSearch={onSearch}
                  onFilterChange={onFilterChange}
                />
              </div>

              {/* Tabs & Add Button */}
              <div className="flex items-center justify-between">
                <DesktopTabs
                  tabs={["Recent", "History"]}
                  onTabChange={onTabChange}
                  activeTab={activeTab}
                />
                {isLocationSpecialist() && (
                  <AddButton
                    onClick={() => router.push("/usulan_lokasi/tambah")}
                  />
                )}
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUlok.length === 0 ? (
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
