"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import SearchBar from "@/components/ui/searchbar";
import FilterDropdown from "@/components/ui/filterdropdown";

export default function SearchWithFilter({
  onSearch,
  onFilterChange,
}: {
  onSearch: (value: string) => void;
  onFilterChange: (month: string, year: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  // setiap kali search berubah
  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearch(value); // langsung kirim ke parent
  };

  // setiap kali filter berubah
  const handleMonthChange = (value: string) => {
    setMonth(value);
    onFilterChange(value, year); // otomatis update
  };

  const handleYearChange = (value: string) => {
    setYear(value);
    onFilterChange(month, value); // otomatis update
  };

  return (
    <div className="flex items-center gap-5 relative">
      <SearchBar value={search} onChange={handleSearchChange} />

      <button
        onClick={() => setShowFilter(!showFilter)}
        className="flex items-center justify-center bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-xl w-[46px] h-[46px] p-2 hover:bg-gray-100"
      >
        <Filter className="text-red-600 w-[18px] h-[18px]" />
      </button>

      <FilterDropdown
        month={month}
        year={year}
        setMonth={handleMonthChange}
        setYear={handleYearChange}
        show={showFilter}
        setShow={setShowFilter}
      />
    </div>
  );
}
