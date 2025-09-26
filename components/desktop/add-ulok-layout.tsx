"use client";

import { Input } from "@/components/ui/input";
import { MapPin, ArrowLeft, FileUp } from "lucide-react";
import CustomSelect from "@/components/ui/customselect";
import { Button } from "@/components/ui/button";
import WilayahSelector from "@/components/desktop/wilayahselector";
import { UlokCreateInput } from "@/lib/validations/ulok";
import { Dialog } from "@headlessui/react";
import dynamic from "next/dynamic";
import { useAddUlokForm } from "@/hooks/useAddUlokForm";
import Navbar from "./navbar";
import Sidebar from "./sidebar";
import { useSidebar } from "@/hooks/useSidebar";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/ui/uploadfile";

// Pastikan hook ini di-import

interface TambahUlokFormProps {
  onSubmit: (data: UlokCreateInput) => Promise<void>;
  isSubmitting: boolean;
}

const LocationPickerModal = dynamic(
  () => import("@/components/map/LocationPickerMap"),
  { ssr: false }
);

export default function AddUlokFormDesktop({
  onSubmit,
  isSubmitting,
}: TambahUlokFormProps) {
  const { isCollapsed } = useSidebar();

  const {
    formData,
    errors,
    isMapOpen,
    setIsMapOpen,
    handleChange,
    handleFileChange,
    handleWilayahChange,
    handleMapSelect,
    handleFormSubmit,
  } = useAddUlokForm({ onSubmit, isSubmitting });

  const formatStoreOptions = ["Reguler", "Super", "Spesifik", "Franchise"];
  const bentukObjekOptions = ["Tanah", "Bangunan"];
  const router = useRouter();

  // --- LOGIKA LOADING SELESAI ---

  // 4. Jika lolos dari dua kondisi di atas, tampilkan halaman lengkap
  return (
    <div className="flex">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col bg-gray-50 min-h-screen transition-all duration-300 ${
          isCollapsed ? "ml-[80px]" : "ml-[270px]"
        }`}
      >
        <Navbar />
        <main className="p-6">
          <form
            onSubmit={handleFormSubmit}
            className="space-y-10 max-w-7xl mx-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <Button onClick={() => router.back()} variant="back">
                <ArrowLeft size={20} className="mr-1" />
                Kembali
              </Button>
            </div>
            {/* === KARTU DATA LOKASI === */}
            <div className="relative">
              <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded shadow-md font-semibold">
                Data Lokasi
              </div>
              <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded p-6 pt-10 space-y-4">
                {/* Nama ULOK */}
                <div>
                  <label htmlFor="namaUlok" className="block font-bold mb-1">
                    Nama ULOK <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="namaUlok"
                    name="namaUlok"
                    placeholder="Masukkan nama ULOK"
                    value={formData.namaUlok}
                    onChange={handleChange}
                  />
                  {errors.namaUlok && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.namaUlok}
                    </p>
                  )}
                </div>

                <WilayahSelector
                  onWilayahChange={handleWilayahChange}
                  errors={errors}
                />

                {/* Alamat */}
                <div>
                  <label htmlFor="alamat" className="block font-semibold mb-1">
                    Alamat <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="alamat"
                    name="alamat"
                    placeholder="Masukkan alamat lengkap"
                    value={formData.alamat}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                  {errors.alamat && (
                    <p className="text-red-500 text-sm mt-1">{errors.alamat}</p>
                  )}
                </div>

                {/* LatLong */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="latlong" className="block font-bold mb-1">
                      LatLong <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="latlong"
                        name="latlong"
                        placeholder="Contoh: -6.175, 106.828"
                        value={formData.latlong}
                        onChange={handleChange}
                        className="flex-grow"
                      />
                      <button
                        type="button"
                        onClick={() => setIsMapOpen(true)}
                        className="p-2 border rounded-md hover:bg-gray-100 flex-shrink-0"
                      >
                        <MapPin className="text-red-500" size={18} />
                      </button>
                    </div>
                    {errors.latlong && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.latlong}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bagian Data Store */}
            <div className="mt-10 relative max-w-7xl mx-auto">
              <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded shadow-md font-semibold">
                Data Store
              </div>
              <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded p-6 space-y-4">
                {/* Format Store */}
                <CustomSelect
                  id="formatStore"
                  name="formatStore"
                  label="Format Store"
                  placeholder="Pilih Format Store"
                  value={formData.formatStore}
                  options={formatStoreOptions}
                  onChange={handleChange}
                  error={errors.formatStore}
                />

                {/* Bentuk Objek */}
                <CustomSelect
                  id="bentukObjek"
                  name="bentukObjek"
                  label="Bentuk Objek"
                  placeholder="Pilih Bentuk Objek"
                  value={formData.bentukObjek}
                  options={bentukObjekOptions}
                  onChange={handleChange}
                  error={errors.bentukObjek}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Alas Hak */}
                  <div>
                    <label htmlFor="alasHak" className="block font-bold mb-1">
                      Alas Hak <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="alasHak"
                      name="alasHak"
                      placeholder="Masukkan Alas Hak"
                      value={formData.alasHak}
                      onChange={handleChange}
                    />
                    {errors.alasHak && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.alasHak}
                      </p>
                    )}
                  </div>
                  {/* Jumlah Lantai */}
                  <div>
                    <label
                      htmlFor="jumlahlantai"
                      className="block font-semibold mb-1"
                    >
                      Jumlah Lantai <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="jumlahlantai"
                      name="jumlahlantai"
                      placeholder="Masukkan Jumlah Lantai"
                      value={formData.jumlahlantai}
                      onChange={handleChange}
                    />
                    {errors.jumlahlantai && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.jumlahlantai}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Lebar Depan */}
                  <div>
                    <label
                      htmlFor="lebardepan"
                      className="block font-bold mb-1"
                    >
                      Lebar Depan(m) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="lebardepan"
                      name="lebardepan"
                      placeholder="Masukkan Lebar Depan"
                      value={formData.lebardepan}
                      onChange={handleChange}
                    />
                    {errors.lebardepan && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.lebardepan}
                      </p>
                    )}
                  </div>
                  {/* Panjang */}
                  <div>
                    <label htmlFor="Panjang" className="block font-bold mb-1">
                      Panjang(m) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="Panjang"
                      name="panjang"
                      placeholder="Masukkan Panjang"
                      value={formData.panjang}
                      onChange={handleChange}
                    />
                    {errors.panjang && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.panjang}
                      </p>
                    )}
                  </div>
                  {/* Luas */}
                  <div>
                    <label htmlFor="luas" className="block font-bold mb-1">
                      Luas(m) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="luas"
                      name="luas"
                      placeholder="Masukkan Luas"
                      value={formData.luas}
                      onChange={handleChange}
                    />
                    {errors.luas && (
                      <p className="text-red-500 text-sm mt-1">{errors.luas}</p>
                    )}
                  </div>
                </div>

                {/* Harga Sewa */}
                <div>
                  <label htmlFor="hargasewa" className="block font-bold mb-1">
                    Harga Sewa (+PPH 10%){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="hargasewa"
                    name="hargasewa"
                    placeholder="Masukkan Harga Sewa"
                    value={formData.hargasewa}
                    onChange={handleChange}
                  />
                  {errors.hargasewa && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.hargasewa}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bagian Data Pemilik */}
            <div className="mt-10 relative max-w-7xl mx-auto">
              <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded shadow-md font-bold">
                Data Pemilik
              </div>
              <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded p-6 space-y-4">
                {/* Nama Pemilik */}
                <div>
                  <label htmlFor="namapemilik" className="block font-bold mb-1">
                    Nama Pemilik <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="namapemilik"
                    name="namapemilik"
                    placeholder="Masukkan Nama Pemilik"
                    value={formData.namapemilik}
                    onChange={handleChange}
                  />
                  {errors.namapemilik && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.namapemilik}
                    </p>
                  )}
                </div>

                {/* Kontak Pemilik */}
                <div>
                  <label
                    htmlFor="kontakpemilik"
                    className="block font-bold mb-1"
                  >
                    Kontak Pemilik <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="kontakpemilik"
                    name="kontakpemilik"
                    placeholder="Masukkan Kontak Pemilik"
                    value={formData.kontakpemilik}
                    onChange={handleChange}
                  />
                  {errors.kontakpemilik && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.kontakpemilik}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* From Kelengkapan */}
            <div className="mt-10 relative max-w-7xl mx-auto">
              {/* Tab Merah di Atas */}
              <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded shadow-md font-bold">
                Form Kelengkapan
              </div>

              {/* Kontainer Putih */}
              <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-lg p-6">
                <div>
                  {/* Area Upload yang Bisa Diklik */}
                  <FileUpload
                    label="Upload Form Kelengkapan"
                    name="formulok"
                    value={formData.formulok}
                    onChange={handleFileChange}
                  />
                  {errors.formulok && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.formulok}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol Submit */}
            <div className="flex justify-end mb-4">
              <Button
                type="submit"
                variant="submit"
                className="p-5 "
                disabled={isSubmitting}
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Usulan Lokasi"}
              </Button>
            </div>
          </form>
        </main>

        <Dialog
          open={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-3xl h-[80vh] bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="p-4 border-b">
                <Dialog.Title className="text-lg font-medium">
                  Pilih Lokasi dari Peta
                </Dialog.Title>
                <p className="text-sm text-gray-500">
                  Klik pada peta untuk memilih koordinat.
                </p>
              </div>
              <div className="h-[calc(100%-80px)]">
                {isMapOpen && (
                  <LocationPickerModal onConfirm={handleMapSelect} />
                )}
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
