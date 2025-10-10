// components/desktop/KPLT-layout.tsx
"use client";

import { KpltPageProps } from "@/types/common";
import DesktopTabs from "@/components/desktop/tabs";
import SearchWithFilter from "@/components/desktop/searchwithfilter";
import { InfoCard } from "@/components/ui/infocard";

export default function DesktopKpltLayout(props: KpltPageProps) {
  const {
    isLoading,
    isError,
    activeTab,
    displayData,
    searchQuery,
    filterMonth,
    filterYear,
    onSearch,
    onFilterChange,
    onTabChange,
  } = props;

  return (
    <div className="flex">
      <main className="flex-1 p-6 space-y-6">
        {isLoading ? (
          <div>
            <div className="h-9 w-1/3 bg-gray-200 rounded animate-pulse"></div>
            <div className="mt-6 h-[500px] w-full bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900">
                Gagal Memuat Data
              </h3>
              <p className="text-gray-600 mb-4">
                Terjadi kesalahan saat mengambil data KPLT. Silakan coba lagi.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                Muat Ulang
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold">KPLT</h1>
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
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayData.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16">
                  <div className="text-gray-300 text-6xl mb-4">📍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery || filterMonth || filterYear
                      ? "Tidak ada data yang cocok"
                      : "Belum ada data KPLT"}
                  </h3>
                  <p className="text-gray-500 text-center max-w-md">
                    {searchQuery || filterMonth || filterYear
                      ? "Coba ubah kata kunci pencarian atau filter untuk menemukan data yang Anda cari."
                      : activeTab === "Recent"
                      ? "Mulai dengan menambahkan KPLT baru."
                      : "Belum ada data riwayat KPLT."}
                  </p>
                </div>
              ) : (
                displayData.map((kplt) => {
                  // ▼▼▼ LOGIKA NAVIGASI KONDISIONAL DIMULAI DI SINI ▼▼▼

                  const status = kplt.status.toLowerCase();
                  const destinationUrl =
                    status === "need input"
                      ? `/form_kplt/tambah/` // Arahkan ke halaman tambah
                      : `/form_kplt/detail/`; // Status lain (In Progress, History) arahkan ke halaman detail

                  return (
                    <InfoCard
                      key={kplt.id}
                      id={kplt.id}
                      nama={kplt.nama}
                      alamat={kplt.alamat}
                      created_at={kplt.created_at}
                      status={kplt.status}
                      detailPath={destinationUrl} // Gunakan URL dinamis yang sudah kita tentukan
                    />
                  );
                })
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
