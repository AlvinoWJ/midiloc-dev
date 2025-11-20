"use client";

interface TabsProps {
  tabs: string[];
  onTabChange: (tab: string) => void;
  activeTab: string;
}

export default function Tabs({ tabs, onTabChange, activeTab }: TabsProps) {
  return (
    <div className="inline-flex w-[482px] bg-white rounded-2xl p-1 shadow-[1px_1px_6px_rgba(0,0,0,0.25)] max-md:grid max-md:grid-cols-2 max-md:gap-1 max-md:w-full max-md:shadow-md max-md:border max-md:border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`text-sm font-semibold rounded-xl transition-all duration-200 flex-1 h-[40px] max-md:h-auto max-md:py-3 max-md:px-4
            ${
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
