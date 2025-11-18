"use client";

import { useState, useEffect, useRef } from "react";

interface Wilayah {
  code: string;
  name: string;
}

interface WilayahSelectorProps {
  onWilayahChange: (field: string, value: string) => void;
  errors: Record<string, string | undefined>;
  initialProvince?: string;
  initialRegency?: string;
  initialDistrict?: string;
  initialVillage?: string;
}

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

  useEffect(() => {
    if (!isOpen) {
      setInputValue(selectedName || "");
    }
  }, [selectedName, isOpen]);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
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
    if (!isOpen && value.length > 0) {
      setIsOpen(true);
    }
    if (value.length === 0 && !selectedName) {
      setIsOpen(false);
    }
  };

  const handleInputFocus = () => {
    if (!disabled && !isLoading) {
      setIsOpen(true);
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
      <label
        htmlFor={id}
        className="block font-semibold text-base lg:text-lg mb-2"
      >
        {label}
        <span className="text-red-500">*</span>
      </label>

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
          className={`w-full p-2 pr-16 border border-gray-300 text-base text-black font-medium shadow-sm rounded focus:outline-none focus:border-blue-500 ${
            disabled || isLoading ? "bg-white cursor-not-allowed" : "bg-white"
          } ${error ? "border-red-500" : ""}`}
          autoComplete="off"
        />

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

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

const WilayahSelector: React.FC<WilayahSelectorProps> = ({
  onWilayahChange,
  errors,
  initialProvince,
  initialRegency,
  initialDistrict,
  initialVillage,
}) => {
  const [provinces, setProvinces] = useState<Wilayah[]>([]);
  const [regencies, setRegencies] = useState<Wilayah[]>([]);
  const [districts, setDistricts] = useState<Wilayah[]>([]);
  const [villages, setVillages] = useState<Wilayah[]>([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedRegency, setSelectedRegency] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");

  const [selectedProvinceName, setSelectedProvinceName] = useState("");
  const [selectedRegencyName, setSelectedRegencyName] = useState("");
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [selectedVillageName, setSelectedVillageName] = useState("");

  const [loadingStates, setLoadingStates] = useState({
    provinces: false,
    regencies: false,
    districts: false,
    villages: false,
  });

  useEffect(() => {
    const fetchAllData = async () => {
      setLoadingStates((prev) => ({ ...prev, provinces: true }));
      try {
        const resProvinces = await fetch("/api/wilayah?type=provinces");
        const dataProvinces = await resProvinces.json();
        const provincesList = dataProvinces.data || [];
        setProvinces(provincesList);

        if (initialProvince) {
          const province = provincesList.find(
            (p: Wilayah) => p.name === initialProvince
          );
          if (province) {
            setSelectedProvince(province.code);
            setSelectedProvinceName(initialProvince);
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data provinsi:", error);
      } finally {
        setLoadingStates((prev) => ({ ...prev, provinces: false }));
      }
    };
    fetchAllData();
  }, [initialProvince]);

  useEffect(() => {
    if (selectedProvince) {
      const fetchRegencies = async () => {
        setLoadingStates((prev) => ({ ...prev, regencies: true }));
        try {
          const resRegencies = await fetch(
            `/api/wilayah?type=regencies&code=${selectedProvince}`
          );
          const dataRegencies = await resRegencies.json();
          const regenciesList = dataRegencies.data || [];
          setRegencies(regenciesList);

          if (initialRegency) {
            const regency = regenciesList.find(
              (r: Wilayah) => r.name === initialRegency
            );
            if (regency) {
              setSelectedRegency(regency.code);
              setSelectedRegencyName(initialRegency);
            }
          }
        } catch (error) {
          console.error("Gagal mengambil data kabupaten:", error);
        } finally {
          setLoadingStates((prev) => ({ ...prev, regencies: false }));
        }
      };
      fetchRegencies();
    } else {
      setRegencies([]);
      setSelectedRegency("");
      setSelectedRegencyName("");
    }
  }, [selectedProvince, initialRegency]);

  useEffect(() => {
    if (selectedRegency) {
      const fetchDistricts = async () => {
        setLoadingStates((prev) => ({ ...prev, districts: true }));
        try {
          const resDistricts = await fetch(
            `/api/wilayah?type=districts&code=${selectedRegency}`
          );
          const dataDistricts = await resDistricts.json();
          const districtsList = dataDistricts.data || [];
          setDistricts(districtsList);

          if (initialDistrict) {
            const district = districtsList.find(
              (d: Wilayah) => d.name === initialDistrict
            );
            if (district) {
              setSelectedDistrict(district.code);
              setSelectedDistrictName(initialDistrict);
            }
          }
        } catch (error) {
          console.error("Gagal mengambil data kecamatan:", error);
        } finally {
          setLoadingStates((prev) => ({ ...prev, districts: false }));
        }
      };
      fetchDistricts();
    } else {
      setDistricts([]);
      setSelectedDistrict("");
      setSelectedDistrictName("");
    }
  }, [selectedRegency, initialDistrict]);

  useEffect(() => {
    if (selectedDistrict) {
      const fetchVillages = async () => {
        setLoadingStates((prev) => ({ ...prev, villages: true }));
        try {
          const resVillages = await fetch(
            `/api/wilayah?type=villages&code=${selectedDistrict}`
          );
          const dataVillages = await resVillages.json();
          const villagesList = dataVillages.data || [];
          setVillages(villagesList);

          if (initialVillage) {
            const village = villagesList.find(
              (v: Wilayah) => v.name === initialVillage
            );
            if (village) {
              setSelectedVillage(village.code);
              setSelectedVillageName(initialVillage);
            }
          }
        } catch (error) {
          console.error("Gagal mengambil data kelurahan:", error);
        } finally {
          setLoadingStates((prev) => ({ ...prev, villages: false }));
        }
      };
      fetchVillages();
    } else {
      setVillages([]);
      setSelectedVillage("");
      setSelectedVillageName("");
    }
  }, [selectedDistrict, initialVillage]);

  const handleProvinceChange = (code: string, name: string) => {
    setSelectedProvince(code);
    setSelectedProvinceName(name);
    onWilayahChange("provinsi", name);
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
