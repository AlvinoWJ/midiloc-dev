"use client";

import { useState } from "react";

interface TabsProps {
  tabs: string[];
  onTabChange?: (tab: string) => void;
}

export default function Tabs({ tabs, onTabChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  const handleClick = (tab: string) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  return (
    <div className="inline-flex w-[482px] bg-white rounded-2xl p-1 shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => handleClick(tab)}
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
