import { UlokPageProps } from "@/types/common";
import MobileSidebar from "./sidebar";
import MobileNavbar from "./navbar";
import MobileInfoCard from "./infocard";
import MobileTabs from "./tabs";
import MobileAddButton from "./addbutton";
import MobileSearchWithFilter from "./searchwithfilter";
import { useRouter } from "next/navigation";

export default function MobileUlokLayout(props: UlokPageProps) {
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
    <div className="min-h-screen bg-gray-50">
      <MobileSidebar />
      <MobileNavbar />

      {/* Main Content */}
      <main className="px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-32 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Gagal Memuat Data
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Terjadi kesalahan saat mengambil data ulok. Silakan coba lagi.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors w-full max-w-xs"
            >
              Muat Ulang
            </button>
          </div>
        ) : (
          <>
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Usulan Lokasi
              </h1>
            </div>

            {/* Search and Filter */}
            <div className="mb-4">
              <MobileSearchWithFilter
                onSearch={onSearch}
                onFilterChange={onFilterChange}
              />
            </div>

            {/* Tabs */}
            <div className="mb-4">
              <MobileTabs
                tabs={["Recent", "History"]}
                onTabChange={onTabChange}
                activeTab={activeTab}
              />
            </div>

            {/* Add Button */}
            {isLocationSpecialist() && (
              <div className="mb-6">
                <MobileAddButton
                  onClick={() => router.push("/usulan_lokasi/tambah")}
                  label="+ Tambah Usulan"
                />
              </div>
            )}

            {/* Cards */}
            <div className="space-y-4 pb-6">
              {filteredUlok.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="text-gray-300 text-6xl mb-4">📍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery || filterMonth || filterYear
                      ? "Tidak ada data yang cocok"
                      : "Belum ada data ulok"}
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
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
                        className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors w-full max-w-xs"
                      >
                        Tambah Usulan Lokasi
                      </button>
                    )}
                </div>
              ) : (
                filteredUlok.map((ulok) => (
                  <MobileInfoCard
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
  );
}
