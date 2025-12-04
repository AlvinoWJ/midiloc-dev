"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useBranchList } from "@/hooks/ulok_eksternal/useBranchList";

interface SelectBranchProps {
  id?: string;
  value: string; // ID branch yang sedang dipilih
  onValueChange: (branchId: string) => void; // callback saat user memilih branch
  disabled?: boolean; // disable input
  placeholder?: string; // teks placeholder
}

const SelectBranch: React.FC<SelectBranchProps> = ({
  id,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Pilih...",
}) => {
  // Ambil data branch dari API melalui custom hook
  const { branches, isLoadingBranches } = useBranchList();

  // State untuk membuka/menutup dropdown
  const [isOpen, setIsOpen] = useState(false);

  // Ref untuk mendeteksi klik di luar dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cari nama branch berdasarkan id yang dipilih (memoized)
  const selectedBranchName = useMemo(
    () => branches?.find((b) => b.id === value)?.nama ?? "",
    [branches, value]
  );

  // Teks yang ditampilkan di input (loading, label, placeholder)
  const displayValue = isLoadingBranches
    ? "Memuat branch..."
    : selectedBranchName || placeholder;

  // Jika disable atau loading
  const isDisabled = disabled || isLoadingBranches;

  // Ketika user memilih salah satu opsi dropdown
  const handleOptionClick = (branchId: string) => {
    onValueChange(branchId);
    setIsOpen(false);
  };

  // Tutup dropdown jika user klik di luar area komponen
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
      {/* Input utama dropdown */}
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
            !selectedBranchName && !isLoadingBranches
              ? "text-muted-foreground"
              : "text-black"
          }
        `}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
      >
        {/* Label yang tampil */}
        <span>{displayValue}</span>

        {/* Icon Chevron yang berputar saat dropdown terbuka */}
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
          {/* Jika ada data branch */}
          {branches && branches.length > 0
            ? branches.map((branch) => (
                <li
                  key={branch.id}
                  onMouseDown={() => handleOptionClick(branch.id)} // gunakan mousedown supaya tidak kehilangan fokus sebelum klik
                  className="p-2 cursor-pointer hover:bg-gray-100 text-black"
                >
                  {branch.nama}
                </li>
              ))
            : // Jika tidak ada data dan tidak sedang loading
              !isLoadingBranches && (
                <li className="p-2 text-gray-500">Tidak ada data branch.</li>
              )}
        </ul>
      )}
    </div>
  );
};

export default SelectBranch;
