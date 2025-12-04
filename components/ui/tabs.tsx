"use client";

interface TabsProps {
  tabs: string[]; // Daftar nama tab yang akan ditampilkan
  onTabChange: (tab: string) => void; // Callback ketika tab diklik
  activeTab: string; // Nama tab yang sedang aktif
}

export default function Tabs({ tabs, onTabChange, activeTab }: TabsProps) {
  return (
    // Wrapper container: background putih, rounded, shadow, responsif pada mobile
    <div
      className="inline-flex w-[482px] bg-white rounded-2xl p-1 shadow-[1px_1px_6px_rgba(0,0,0,0.25)]
      max-md:grid max-md:grid-cols-2 max-md:gap-1 max-md:w-full max-md:shadow-md max-md:border max-md:border-gray-200"
    >
      {/* Render semua tab secara dinamis */}
      {tabs.map((tab) => (
        <button
          key={tab} // Key unik untuk elemen list
          onClick={() => onTabChange(tab)} // Trigger perubahan tab
          className={`
            text-sm font-semibold rounded-xl transition-all duration-200 flex-1 h-[40px]
            max-md:h-auto max-md:py-3 max-md:px-4
            ${
              // Jika tab aktif → gunakan warna utama
              activeTab === tab
                ? "bg-primary text-primary-foreground shadow"
                : // Jika tidak aktif → warna abu + hover state
                  "text-gray-800 hover:bg-gray-100"
            }
          `}
        >
          {/* Menampilkan label tab */}
          {tab}
        </button>
      ))}
    </div>
  );
}
