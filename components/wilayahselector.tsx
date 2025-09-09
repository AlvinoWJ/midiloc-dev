"use client";

import { useState, useEffect } from "react";

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

  const [isLoading, setIsLoading] = useState(false);

  // --- useEffect untuk fetch data ---
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoading(true);
      try {
        // URL ini sudah benar dari awal
        const response = await fetch("/api/wilayah?type=provinces");
        const data = await response.json();
        setProvinces(data.data || []);
      } catch (error) {
        console.error("Gagal mengambil data provinsi:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      const fetchRegencies = async () => {
        setIsLoading(true);
        try {
          // ✅ DIUBAH: Sesuaikan dengan API route tunggal
          const response = await fetch(
            `/api/wilayah?type=regencies&code=${selectedProvince}`
          );
          const data = await response.json();
          setRegencies(data.data || []);
        } catch (error) {
          console.error("Gagal mengambil data kabupaten:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRegencies();
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedRegency) {
      const fetchDistricts = async () => {
        setIsLoading(true);
        try {
          // ✅ DIUBAH: Sesuaikan dengan API route tunggal
          const response = await fetch(
            `/api/wilayah?type=districts&code=${selectedRegency}`
          );
          const data = await response.json();
          setDistricts(data.data || []);
        } catch (error) {
          console.error("Gagal mengambil data kecamatan:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDistricts();
    }
  }, [selectedRegency]);

  useEffect(() => {
    if (selectedDistrict) {
      const fetchVillages = async () => {
        setIsLoading(true);
        try {
          // ✅ DIUBAH: Sesuaikan dengan API route tunggal
          const response = await fetch(
            `/api/wilayah?type=villages&code=${selectedDistrict}`
          );
          const data = await response.json();
          setVillages(data.data || []);
        } catch (error) {
          console.error("Gagal mengambil data kelurahan:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchVillages();
    }
  }, [selectedDistrict]);

  // --- Handlers (Tidak perlu diubah, sudah benar) ---
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;

    setSelectedProvince(code);
    onWilayahChange("provinsi", code ? name : "");

    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    setSelectedRegency("");
    setSelectedDistrict("");
    setSelectedVillage("");
  };

  const handleRegencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;

    setSelectedRegency(code);
    onWilayahChange("kabupaten", code ? name : "");

    setDistricts([]);
    setVillages([]);
    setSelectedDistrict("");
    setSelectedVillage("");
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;

    setSelectedDistrict(code);
    onWilayahChange("kecamatan", code ? name : "");

    setVillages([]);
    setSelectedVillage("");
  };

  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;

    setSelectedVillage(code);
    onWilayahChange("kelurahan", code ? name : "");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-4">
      {/* Provinsi */}
      <div>
        <label htmlFor="provinsi" className="block font-bold mb-1">
          Provinsi <span className="text-red-500">*</span>
        </label>
        <select
          id="provinsi"
          name="provinsi"
          value={selectedProvince}
          onChange={handleProvinceChange}
          disabled={isLoading}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">{isLoading ? "Memuat..." : "Pilih Provinsi"}</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
        {errors.provinsi && (
          <p className="text-red-500 text-sm mt-1">{errors.provinsi}</p>
        )}
      </div>

      {/* Kabupaten/Kota */}
      <div>
        <label htmlFor="kabupaten" className="block font-bold mb-1">
          Kabupaten/Kota <span className="text-red-500">*</span>
        </label>
        <select
          id="kabupaten"
          name="kabupaten"
          value={selectedRegency}
          onChange={handleRegencyChange}
          disabled={isLoading || !selectedProvince}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">Pilih Kabupaten/Kota</option>
          {regencies.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
        {errors.kabupaten && (
          <p className="text-red-500 text-sm mt-1">{errors.kabupaten}</p>
        )}
      </div>

      {/* Kecamatan */}
      <div>
        <label htmlFor="kecamatan" className="block font-bold mb-1">
          Kecamatan <span className="text-red-500">*</span>
        </label>
        <select
          id="kecamatan"
          name="kecamatan"
          value={selectedDistrict}
          onChange={handleDistrictChange}
          disabled={isLoading || !selectedRegency}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">Pilih Kecamatan</option>
          {districts.map((d) => (
            <option key={d.code} value={d.code}>
              {d.name}
            </option>
          ))}
        </select>
        {errors.kecamatan && (
          <p className="text-red-500 text-sm mt-1">{errors.kecamatan}</p>
        )}
      </div>

      {/* Kelurahan/Desa */}
      <div>
        <label htmlFor="kelurahan" className="block font-bold mb-1">
          Kelurahan/Desa <span className="text-red-500">*</span>
        </label>
        <select
          id="kelurahan"
          name="kelurahan"
          value={selectedVillage}
          onChange={handleVillageChange}
          disabled={isLoading || !selectedDistrict}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">Pilih Kelurahan/Desa</option>
          {villages.map((v) => (
            <option key={v.code} value={v.code}>
              {v.name}
            </option>
          ))}
        </select>
        {errors.kelurahan && (
          <p className="text-red-500 text-sm mt-1">{errors.kelurahan}</p>
        )}
      </div>
    </div>
  );
};

export default WilayahSelector;
