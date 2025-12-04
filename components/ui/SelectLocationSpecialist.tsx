"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useLocationSpecialistList } from "@/hooks/ulok_eksternal/useLocationSpecialist";

interface SelectLocationSpecialistProps {
  id?: string;
  value: string; // ID specialist yang sedang dipilih
  onValueChange: (specialistId: string) => void; // callback saat pilihan berubah
  disabled?: boolean; // mematikan seluruh dropdown
  placeholder?: string; // teks placeholder saat belum memilih
}

const SelectLocationSpecialist: React.FC<SelectLocationSpecialistProps> = ({
  id,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Pilih Location Specialist...",
}) => {
  // Ambil daftar specialist dari API melalui custom hook
  const { specialists, isLoadingSpecialists } = useLocationSpecialistList();

  // Menyimpan state dropdown terbuka/tutup
  const [isOpen, setIsOpen] = useState(false);

  // Dipakai untuk mendeteksi klik di luar dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ambil nama specialist sesuai ID yang dipilih (memoized untuk optimasi)
  const selectedSpecialistName = useMemo(
    () => specialists?.find((s) => s.id === value)?.nama ?? "",
    [specialists, value]
  );

  // Tentukan apa yang harus ditampilkan di input
  const displayValue = isLoadingSpecialists
    ? "Memuat specialist..."
    : selectedSpecialistName || placeholder;

  // Dropdown otomatis disabled jika loading atau parameter disabled = true
  const isDisabled = disabled || isLoadingSpecialists;

  // Ketika user memilih salah satu opsi
  const handleOptionClick = (specialistId: string) => {
    onValueChange(specialistId);
    setIsOpen(false); // tutup dropdown setelah memilih
  };

  // Tutup dropdown saat user klik di luar komponen
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Area input dropdown (bukan <select>, tapi custom div yang bisa diklik) */}
      <div
        id={id}
        tabIndex={0}
        className={`
          flex h-9 w-full rounded border border-gray-300 bg-transparent px-3 py-1
          text-base shadow-sm transition-colors justify-between items-center cursor-pointer
          placeholder:text-muted-foreground focus:outline-none focus:border-primary 
          focus:ring-1 focus:ring-primary
          ${isDisabled ? "cursor-not-allowed opacity-50 bg-gray-100" : ""}
          ${
            !selectedSpecialistName && !isLoadingSpecialists
              ? "text-muted-foreground"
              : "text-black"
          }
        `}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
      >
        {/* Teks value / placeholder */}
        <span>{displayValue}</span>

        {/* Ikon dropdown dengan animasi rotasi */}
        <ChevronDown
          size={18}
          className={`transition-transform ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </div>

      {/* Dropdown list */}
      {isOpen && !isDisabled && (
        <ul className="absolute z-10 w-full mt-1 border border-input rounded-md bg-white shadow-lg max-h-60 overflow-y-auto">
          {/* Jika data specialist tersedia */}
          {specialists && specialists.length > 0
            ? specialists.map((specialist) => (
                <li
                  key={specialist.id}
                  onMouseDown={() => handleOptionClick(specialist.id)}
                  // gunakan onMouseDown agar tidak kehilangan fokus sebelum klik selesai
                  className="p-2 cursor-pointer hover:bg-gray-100 text-black"
                >
                  {specialist.nama}
                </li>
              ))
            : // Jika data kosong dan tidak sedang loading
              !isLoadingSpecialists && (
                <li className="p-2 text-gray-500">
                  Tidak ada data specialist.
                </li>
              )}
        </ul>
      )}
    </div>
  );
};

export default SelectLocationSpecialist;
