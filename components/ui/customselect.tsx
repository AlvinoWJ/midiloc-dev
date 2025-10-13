"use client";

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleOptionClick = (option: string) => {
    const syntheticEvent = {
      target: { name, value: option },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange(syntheticEvent);
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
      <label
        htmlFor={id}
        className="block font-semibold text-base lg:text-lg mb-2"
      >
        {label}
        <span className="text-red-500">*</span>
      </label>
      <div
        tabIndex={0}
        className={`flex h-9 w-full rounded border border-gray-300 bg-transparent px-3 py-1 text-base shadow-sm transition-colors justify-between items-center cursor-pointer placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
          ${error ? "border-red-500" : "border-gray-300"}
          ${value === "" ? "text-muted-foreground" : "text-black"}`}
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setIsOpen(false)}
      >
        <span>{value || placeholder}</span>
        <ChevronDown
          size={18}
          className={`transition-transform ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </div>
      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 border border-input rounded-md bg-white shadow-lg max-h-60 overflow-y-auto">
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
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default CustomSelect;
