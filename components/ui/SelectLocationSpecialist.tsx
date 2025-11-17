"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useLocationSpecialistList } from "@/hooks/ulok_eksternal/useLocationSpecialist";

interface SelectLocationSpecialistProps {
  id?: string;
  value: string;
  onValueChange: (specialistId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const SelectLocationSpecialist: React.FC<SelectLocationSpecialistProps> = ({
  id,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Pilih Location Specialist...",
}) => {
  const { specialists, isLoadingSpecialists } = useLocationSpecialistList();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedSpecialistName = useMemo(
    () => specialists?.find((s) => s.id === value)?.nama ?? "",
    [specialists, value]
  );

  const displayValue = isLoadingSpecialists
    ? "Memuat specialist..."
    : selectedSpecialistName || placeholder;

  const isDisabled = disabled || isLoadingSpecialists;

  const handleOptionClick = (specialistId: string) => {
    onValueChange(specialistId);
    setIsOpen(false);
  };

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
      <div
        id={id}
        tabIndex={0}
        className={`flex h-9 w-full rounded border border-gray-300 bg-transparent px-3 py-1 text-base shadow-sm transition-colors justify-between items-center cursor-pointer placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
          ${isDisabled ? "cursor-not-allowed opacity-50 bg-gray-100" : ""}
          ${
            !selectedSpecialistName && !isLoadingSpecialists
              ? "text-muted-foreground"
              : "text-black"
          }
        `}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
      >
        <span>{displayValue}</span>
        <ChevronDown
          size={18}
          className={`transition-transform ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </div>
      {isOpen && !isDisabled && (
        <ul className="absolute z-10 w-full mt-1 border border-input rounded-md bg-white shadow-lg max-h-60 overflow-y-auto">
          {specialists && specialists.length > 0
            ? specialists.map((specialist) => (
                <li
                  key={specialist.id}
                  onMouseDown={() => handleOptionClick(specialist.id)}
                  className="p-2 cursor-pointer hover:bg-gray-100 text-black"
                >
                  {specialist.nama} {/* Menampilkan nama specialist */}
                </li>
              ))
            : !isLoadingSpecialists && (
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
