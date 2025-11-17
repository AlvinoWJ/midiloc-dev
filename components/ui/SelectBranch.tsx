"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useBranchList } from "@/hooks/ulok_eksternal/useBranchList";

interface SelectBranchProps {
  id?: string;
  value: string;
  onValueChange: (branchId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const SelectBranch: React.FC<SelectBranchProps> = ({
  id,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Pilih...",
}) => {
  const { branches, isLoadingBranches } = useBranchList();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedBranchName = useMemo(
    () => branches?.find((b) => b.id === value)?.nama ?? "",
    [branches, value]
  );

  const displayValue = isLoadingBranches
    ? "Memuat branch..."
    : selectedBranchName || placeholder;

  const isDisabled = disabled || isLoadingBranches;

  const handleOptionClick = (branchId: string) => {
    onValueChange(branchId);
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
      {/* Label sekarang ada di file layout, tidak di sini */}
      <div
        id={id}
        tabIndex={0}
        className={`flex h-9 w-full rounded border border-gray-300 bg-transparent px-3 py-1 text-base shadow-sm transition-colors justify-between items-center cursor-pointer placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
          ${isDisabled ? "cursor-not-allowed opacity-50 bg-gray-100" : ""}
          ${
            !selectedBranchName && !isLoadingBranches
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
          {branches && branches.length > 0
            ? branches.map((branch) => (
                <li
                  key={branch.id}
                  onMouseDown={() => handleOptionClick(branch.id)}
                  className="p-2 cursor-pointer hover:bg-gray-100 text-black"
                >
                  {branch.nama}
                </li>
              ))
            : !isLoadingBranches && (
                <li className="p-2 text-gray-500">Tidak ada data branch.</li>
              )}
        </ul>
      )}
    </div>
  );
};

export default SelectBranch;
