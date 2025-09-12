"use client";

interface TabsProps {
  tabs: string[];
  onTabChange: (tab: string) => void; // Dibuat menjadi wajib, bukan opsional
  activeTab: string; // Menerima tab yang aktif dari parent
}

export default function Tabs({ tabs, onTabChange, activeTab }: TabsProps) {
  // `handleClick` bisa disederhanakan atau langsung dipanggil di onClick
  const handleClick = (tab: string) => {
    onTabChange(tab); // Hanya memanggil fungsi dari parent
  };

  return (
    <div className="inline-flex w-[482px] bg-white rounded-2xl p-1 shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => handleClick(tab)}
          // Logika className sekarang menggunakan `activeTab` dari props
          className={`flex-1 h-[40px] text-sm font-semibold rounded-xl transition-all duration-200 ${
            activeTab === tab
              ? "bg-primary text-primary-foreground shadow"
              : "text-gray-800 hover:bg-gray-100"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
