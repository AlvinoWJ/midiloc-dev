"use client";

import { useState, useEffect, useRef } from "react";

// Definisikan tipe data
interface Wilayah {
  code: string;
  name: string;
}

// Definisikan props yang diterima komponen ini
interface WilayahSelectorProps {
  onWilayahChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

// Komponen SearchableDropdown
interface SearchableDropdownProps {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  options: Wilayah[];
  selectedValue: string;
  selectedName: string;
  onChange: (code: string, name: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  error?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  id,
  name,
  label,
  placeholder,
  options,
  selectedValue,
  selectedName,
  onChange,
  disabled = false,
  isLoading = false,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<Wilayah[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- PERBAIKAN DI SINI ---
  // Sinkronkan input value dengan selectedName dari props
  useEffect(() => {
    // Jika dropdown tidak sedang dibuka, paksakan nilainya
    // agar sama dengan selectedName (atau string kosong jika tidak ada).
    if (!isOpen) {
      setInputValue(selectedName || "");
    }
  }, [selectedName, isOpen]);

  // Filter options berdasarkan input value
  useEffect(() => {
    if (inputValue === "" || !isOpen) {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter((option) =>
        option.name.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [inputValue, options, isOpen]);

  // Close dropdown ketika click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Reset input value ke selected name jika ada
        if (selectedName) {
          setInputValue(selectedName);
        } else {
          setInputValue("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedName]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Buka dropdown ketika user mengetik
    if (!isOpen && value.length > 0) {
      setIsOpen(true);
    }

    // Tutup dropdown jika input kosong dan tidak ada yang terpilih
    if (value.length === 0 && !selectedName) {
      setIsOpen(false);
    }
  };

  const handleInputFocus = () => {
    if (!disabled && !isLoading) {
      setIsOpen(true);
      // Clear input saat focus untuk memudahkan pencarian
      if (selectedName) {
        setInputValue("");
      }
    }
  };

  const handleInputClick = () => {
    if (!disabled && !isLoading) {
      setIsOpen(true);
    }
  };

  const handleSelect = (option: Wilayah) => {
    onChange(option.code, option.name);
    setInputValue(option.name);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", "");
    setInputValue("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && !isLoading) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        inputRef.current?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      if (selectedName) {
        setInputValue(selectedName);
      } else {
        setInputValue("");
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label htmlFor={id} className="block font-bold mb-1">
        {label} <span className="text-red-500">*</span>
      </label>

      {/* Input Field */}
      <div
        className={`relative flex items-center ${
          error ? "border-red-500" : ""
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={isLoading ? "Memuat..." : inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onClick={handleInputClick}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={`w-full p-2 pr-16 border border-gray-300 rounded focus:outline-none focus:border-blue-500 ${
            disabled || isLoading ? "bg-white cursor-not-allowed" : "bg-white"
          } ${error ? "border-red-500" : ""}`}
          autoComplete="off"
        />

        {/* Action Buttons */}
        <div className="absolute right-2 flex items-center gap-1">
          {inputValue && !disabled && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 p-1"
              tabIndex={-1}
            >
              ✕
            </button>
          )}
          <button
            type="button"
            onClick={handleDropdownToggle}
            disabled={disabled || isLoading}
            className="text-gray-400 hover:text-gray-600 p-1"
            tabIndex={-1}
          >
            <svg
              className={`w-4 h-4 transition-transform ${
                isOpen ? "transform rotate-180" : ""
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
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.code}
                onClick={() => handleSelect(option)}
                className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                  selectedValue === option.code
                    ? "bg-blue-100 text-blue-800"
                    : "text-gray-900"
                }`}
              >
                {option.name}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500 text-sm">
              Tidak ada data yang ditemukan
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

const WilayahSelector: React.FC<WilayahSelectorProps> = ({
  onWilayahChange,
  errors,
}) => {
  // State untuk menyimpan daftar wilayah dari API
  const [provinces, setProvinces] = useState<Wilayah[]>([]);
  const [regencies, setRegencies] = useState<Wilayah[]>([]);
  const [districts, setDistricts] = useState<Wilayah[]>([]);
  const [villages, setVillages] = useState<Wilayah[]>([]);

  // State INTERNAL untuk mengontrol value dropdown dan memicu useEffect
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedRegency, setSelectedRegency] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");

  // State untuk menyimpan nama yang dipilih (untuk ditampilkan di dropdown)
  const [selectedProvinceName, setSelectedProvinceName] = useState("");
  const [selectedRegencyName, setSelectedRegencyName] = useState("");
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [selectedVillageName, setSelectedVillageName] = useState("");

  // --- PERBAIKAN: Gunakan state object untuk loading individual ---
  const [loadingStates, setLoadingStates] = useState({
    provinces: false,
    regencies: false,
    districts: false,
    villages: false,
  });

  // --- useEffect untuk fetch data (sudah disesuaikan dengan loadingStates) ---
  useEffect(() => {
    const fetchProvinces = async () => {
      // Set loading spesifik untuk provinsi
      setLoadingStates((prev) => ({ ...prev, provinces: true }));
      try {
        const response = await fetch("/api/wilayah?type=provinces");
        const data = await response.json();
        setProvinces(data.data || []);
      } catch (error) {
        console.error("Gagal mengambil data provinsi:", error);
      } finally {
        // Hentikan loading spesifik untuk provinsi
        setLoadingStates((prev) => ({ ...prev, provinces: false }));
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      const fetchRegencies = async () => {
        setLoadingStates((prev) => ({ ...prev, regencies: true }));
        try {
          const response = await fetch(
            `/api/wilayah?type=regencies&code=${selectedProvince}`
          );
          const data = await response.json();
          setRegencies(data.data || []);
        } catch (error) {
          console.error("Gagal mengambil data kabupaten:", error);
        } finally {
          setLoadingStates((prev) => ({ ...prev, regencies: false }));
        }
      };
      fetchRegencies();
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedRegency) {
      const fetchDistricts = async () => {
        setLoadingStates((prev) => ({ ...prev, districts: true }));
        try {
          const response = await fetch(
            `/api/wilayah?type=districts&code=${selectedRegency}`
          );
          const data = await response.json();
          setDistricts(data.data || []);
        } catch (error) {
          console.error("Gagal mengambil data kecamatan:", error);
        } finally {
          setLoadingStates((prev) => ({ ...prev, districts: false }));
        }
      };
      fetchDistricts();
    }
  }, [selectedRegency]);

  useEffect(() => {
    if (selectedDistrict) {
      const fetchVillages = async () => {
        setLoadingStates((prev) => ({ ...prev, villages: true }));
        try {
          const response = await fetch(
            `/api/wilayah?type=villages&code=${selectedDistrict}`
          );
          const data = await response.json();
          setVillages(data.data || []);
        } catch (error) {
          console.error("Gagal mengambil data kelurahan:", error);
        } finally {
          setLoadingStates((prev) => ({ ...prev, villages: false }));
        }
      };
      fetchVillages();
    }
  }, [selectedDistrict]);

  const handleProvinceChange = (code: string, name: string) => {
    setSelectedProvince(code);
    setSelectedProvinceName(name);
    onWilayahChange("provinsi", name);

    // Reset state internal (ini sudah benar)
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    setSelectedRegency("");
    setSelectedDistrict("");
    setSelectedVillage("");
    setSelectedRegencyName("");
    setSelectedDistrictName("");
    setSelectedVillageName("");

    onWilayahChange("kabupaten", "");
    onWilayahChange("kecamatan", "");
    onWilayahChange("kelurahan", "");
  };

  const handleRegencyChange = (code: string, name: string) => {
    setSelectedRegency(code);
    setSelectedRegencyName(name);
    onWilayahChange("kabupaten", name);

    setDistricts([]);
    setVillages([]);
    setSelectedDistrict("");
    setSelectedVillage("");
    setSelectedDistrictName("");
    setSelectedVillageName("");

    onWilayahChange("kecamatan", "");
    onWilayahChange("kelurahan", "");
  };

  const handleDistrictChange = (code: string, name: string) => {
    setSelectedDistrict(code);
    setSelectedDistrictName(name);
    onWilayahChange("kecamatan", name);

    setVillages([]);
    setSelectedVillage("");
    setSelectedVillageName("");

    onWilayahChange("kelurahan", "");
  };

  const handleVillageChange = (code: string, name: string) => {
    setSelectedVillage(code);
    setSelectedVillageName(name);
    onWilayahChange("kelurahan", name);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-4">
      {/* Provinsi */}
      <SearchableDropdown
        id="provinsi"
        name="provinsi"
        label="Provinsi"
        placeholder="Pilih Provinsi"
        options={provinces}
        selectedValue={selectedProvince}
        selectedName={selectedProvinceName}
        onChange={handleProvinceChange}
        isLoading={loadingStates.provinces}
        error={errors.provinsi}
      />

      {/* Kabupaten/Kota */}
      <SearchableDropdown
        id="kabupaten"
        name="kabupaten"
        label="Kabupaten/Kota"
        placeholder="Pilih Kabupaten/Kota"
        options={regencies}
        selectedValue={selectedRegency}
        selectedName={selectedRegencyName}
        onChange={handleRegencyChange}
        disabled={!selectedProvince}
        isLoading={loadingStates.regencies}
        error={errors.kabupaten}
      />

      {/* Kecamatan */}
      <SearchableDropdown
        id="kecamatan"
        name="kecamatan"
        label="Kecamatan"
        placeholder="Pilih Kecamatan"
        options={districts}
        selectedValue={selectedDistrict}
        selectedName={selectedDistrictName}
        onChange={handleDistrictChange}
        disabled={!selectedRegency}
        isLoading={loadingStates.districts}
        error={errors.kecamatan}
      />

      {/* Kelurahan/Desa */}
      <SearchableDropdown
        id="kelurahan"
        name="kelurahan"
        label="Kelurahan/Desa"
        placeholder="Pilih Kelurahan/Desa"
        options={villages}
        selectedValue={selectedVillage}
        selectedName={selectedVillageName}
        onChange={handleVillageChange}
        disabled={!selectedDistrict}
        isLoading={loadingStates.villages}
        error={errors.kelurahan}
      />
    </div>
  );
};
export default WilayahSelector;
