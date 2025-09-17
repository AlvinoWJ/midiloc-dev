// mobile-tabs.tsx
interface MobileTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MobileTabs({
  tabs,
  activeTab,
  onTabChange,
}: MobileTabsProps) {
  return (
    <div className="bg-white rounded-2xl p-1 shadow-md border border-gray-200">
      <div className="grid grid-cols-2 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`py-3 px-4 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === tab
                ? "bg-primary text-primary-foreground shadow"
                : "text-gray-800 hover:bg-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
