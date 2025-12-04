"use client";

/**
 * CustomSelect
 * ------------
 * Komponen dropdown select custom yang menggantikan elemen <select>.
 * Komponen ini dibuat agar tampilan lebih konsisten dan dapat dikustomisasi
 * dibandingkan native <select>.
 *
 * Fitur:
 * - Placeholder custom
 * - Animasi ikon (rotate saat terbuka)
 * - Deteksi klik di luar dropdown (auto close)
 * - Menampilkan pesan error (validasi)
 *
 * Props:
 * - id: ID input
 * - name: nama field
 * - label: label yang muncul di atas input
 * - placeholder: teks placeholder saat belum memilih option
 * - value: nilai terpilih
 * - options: array string berisi daftar pilihan
 * - onChange: handler perubahan data
 * - error: pesan error opsional
 */

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

interface CustomSelectProps {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  name,
  label,
  placeholder,
  value,
  options,
  onChange,
  error,
}) => {
  // State untuk toggle dropdown
  const [isOpen, setIsOpen] = useState(false);

  // Ref container dropdown (untuk deteksi klik di luar)
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * handleOptionClick
   * -----------------
   * Karena komponen ini tidak memakai <select> native,
   * maka kita buat synthetic event agar kompatibel
   * dengan handler form standar React.
   */
  const handleOptionClick = (option: string) => {
    const syntheticEvent = {
      target: { name, value: option },
    } as React.ChangeEvent<HTMLSelectElement>;

    onChange(syntheticEvent);
    setIsOpen(false);
  };

  /**
   * useEffect — click outside handler
   * ---------------------------------
   * Menutup dropdown ketika user klik di luar komponen.
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
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Label */}
      <label
        htmlFor={id}
        className="block font-semibold text-base lg:text-lg mb-2"
      >
        {label}
        <span className="text-red-500">*</span>
      </label>

      {/* Input visual (div yang berperan sebagai select) */}
      <div
        tabIndex={0}
        className={`flex h-11 w-full rounded border bg-transparent px-3 py-1 text-base shadow-sm transition-colors justify-between items-center cursor-pointer
          ${error ? "border-red-500" : "border-gray-300"}
          ${value === "" ? "text-muted-foreground" : "text-black"}
        `}
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setIsOpen(false)}
      >
        <span>{value || placeholder}</span>

        {/* Ikon dropdown — rotate ketika terbuka */}
        <ChevronDown
          size={18}
          className={`transition-transform ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </div>

      {/* Dropdown list */}
      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 border rounded-md bg-white shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <li
              key={option}
              onMouseDown={() => handleOptionClick(option)}
              className="p-2 cursor-pointer hover:bg-gray-100 text-black"
            >
              {option}
            </li>
          ))}
        </ul>
      )}

      {/* Pesan error */}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default CustomSelect;
