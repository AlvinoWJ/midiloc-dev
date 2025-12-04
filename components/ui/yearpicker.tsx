import React, { useState, useRef, useEffect } from "react";

interface YearPickerProps {
  selectedYear: number; // Tahun yang sedang dipilih
  onYearChange: (year: number) => void; // Callback saat memilih tahun baru
  minYear?: number; // Tahun minimal
  maxYear?: number; // Tahun maksimal
}

export default function YearPicker({
  selectedYear,
  onYearChange,
  minYear = 2017, // Default min tahun = 2017
  maxYear = new Date().getFullYear(), // Default max tahun = tahun sekarang
}: YearPickerProps) {
  const [isOpen, setIsOpen] = useState(false); // Kontrol buka/tutup dropdown
  const [displayYears, setDisplayYears] = useState<number[]>([]); // List tahun
  const dropdownRef = useRef<HTMLDivElement>(null); // Referensi untuk deteksi klik di luar

  /**
   * Generate daftar tahun dari maxYear → minYear
   * Contoh: 2025, 2024, 2023, ... 2017
   */
  useEffect(() => {
    const years: number[] = [];
    for (let year = maxYear; year >= minYear; year--) {
      years.push(year);
    }
    setDisplayYears(years);
  }, [minYear, maxYear]);

  /**
   * Menutup dropdown jika user mengklik area di luar komponen
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  /**
   * Aksi ketika tahun dipilih dari dropdown
   */
  const handleYearSelect = (year: number) => {
    onYearChange(year); // Kirim data ke parent
    setIsOpen(false); // Tutup dropdown
  };

  return (
    <div className="relative inline-block w-full sm:w-auto" ref={dropdownRef}>
      {/* === TRIGGER BUTTON === */}
      <div className="relative group">
        {/* Ikon kalender di sisi kiri input */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        {/* Tombol utama untuk membuka dropdown */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="appearance-none w-full sm:w-auto bg-white border border-gray-300 rounded-lg 
                     pl-10 pr-10 py-2.5 text-sm font-medium text-gray-700
                     hover:border-red-400 hover:shadow-md
                     focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500
                     transition-all cursor-pointer min-w-[140px] text-left"
        >
          {selectedYear}
        </button>

        {/* Ikon arrow di kanan — berputar ketika dropdown terbuka */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* === DROPDOWN MENU === */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg 
                        z-50 max-h-64 overflow-y-auto min-w-[140px]"
        >
          <div className="py-1">
            {displayYears.map((year) => (
              <button
                key={year}
                onClick={() => handleYearSelect(year)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  year === selectedYear
                    ? "bg-red-50 text-red-600 font-semibold" // Highlight tahun terpilih
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
