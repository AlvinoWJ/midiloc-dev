"use client";

import { Input } from "@/components/ui/input";
import { MapPin, ArrowLeft } from "lucide-react";
import CustomSelect from "@/components/ui/customselect";
import { Button } from "@/components/ui/button";
import WilayahSelector from "@/components/ui/customselectwilayah";
import { UlokCreateInput } from "@/lib/validations/ulok";
import { Dialog } from "@headlessui/react";
import dynamic from "next/dynamic";
import { useAddUlokForm } from "@/hooks/useAddUlokForm";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/ui/uploadfile";

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

  return (
    <div className="space-y-4 lg:space-y-6">
      <form
        onSubmit={handleFormSubmit}
        className="space-y-8 lg:space-y-10 max-w-7xl mx-auto lg:px-0"
      >
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <Button
            type="button"
            onClick={() => router.back()}
            variant="back"
            className="text-sm lg:text-base"
          >
            <ArrowLeft size={20} className="mr-1 lg:mr-2" />
            Kembali
          </Button>
        </div>

        {/* === KARTU DATA LOKASI === */}
        <div className="relative">
          <div className="absolute -top-3 lg:-top-4 left-4 lg:left-6 bg-red-600 text-white px-3 lg:px-4 py-1 lg:py-1.5 rounded shadow-md font-semibold text-base lg:text-xl">
            Data Lokasi
          </div>
          <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded p-4 lg:p-8 pt-8 lg:pt-12 space-y-4 lg:space-y-6">
            {/* Nama ULOK */}
            <div>
              <label
                htmlFor="namaUlok"
                className="block font-bold mb-1.5 lg:mb-2 text-sm lg:text-base"
              >
                Nama ULOK <span className="text-primary">*</span>
              </label>
              <Input
                id="namaUlok"
                name="namaUlok"
                placeholder="Masukkan nama ULOK"
                value={formData.namaUlok}
                onChange={handleChange}
                className="h-10 lg:h-11 text-sm lg:text-base"
              />
              {errors.namaUlok && (
                <p className="text-red-500 text-xs lg:text-sm mt-1">
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
              <label
                htmlFor="alamat"
                className="block font-semibold mb-1.5 lg:mb-2 text-sm lg:text-base"
              >
                Alamat <span className="text-red-500">*</span>
              </label>
              <textarea
                id="alamat"
                name="alamat"
                placeholder="Masukkan alamat lengkap"
                value={formData.alamat}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 bg-transparent rounded focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm lg:text-base"
              />
              {errors.alamat && (
                <p className="text-red-500 text-xs lg:text-sm mt-1">
                  {errors.alamat}
                </p>
              )}
            </div>

            {/* LatLong */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="latlong"
                  className="block font-bold mb-1.5 lg:mb-2 text-sm lg:text-base"
                >
                  LatLong <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="latlong"
                    name="latlong"
                    placeholder="Contoh: -6.175, 106.828"
                    value={formData.latlong}
                    onChange={handleChange}
                    className="flex-grow h-10 lg:h-11 text-sm lg:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setIsMapOpen(true)}
                    className="p-2 lg:p-2.5 border rounded-md hover:bg-gray-100 flex-shrink-0"
                  >
                    <MapPin className="text-red-500" size={20} />
                  </button>
                </div>
                {errors.latlong && (
                  <p className="text-red-500 text-xs lg:text-sm mt-1">
                    {errors.latlong}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bagian Data Store */}
        <div className="relative">
          <div className="absolute -top-3 lg:-top-4 left-4 lg:left-6 bg-red-600 text-white px-3 lg:px-4 py-1 lg:py-1.5 rounded shadow-md font-semibold text-base lg:text-xl">
            Data Store
          </div>
          <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded p-4 lg:p-8 pt-8 lg:pt-12 space-y-4 lg:space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {/* Alas Hak */}
              <div>
                <label
                  htmlFor="alasHak"
                  className="block font-bold mb-1.5 lg:mb-2 text-sm lg:text-base"
                >
                  Alas Hak <span className="text-red-500">*</span>
                </label>
                <Input
                  id="alasHak"
                  name="alasHak"
                  placeholder="Masukkan Alas Hak"
                  value={formData.alasHak}
                  onChange={handleChange}
                  className="h-10 lg:h-11 text-sm lg:text-base"
                />
                {errors.alasHak && (
                  <p className="text-red-500 text-xs lg:text-sm mt-1">
                    {errors.alasHak}
                  </p>
                )}
              </div>
              {/* Jumlah Lantai */}
              <div>
                <label
                  htmlFor="jumlahlantai"
                  className="block font-semibold mb-1.5 lg:mb-2 text-sm lg:text-base"
                >
                  Jumlah Lantai <span className="text-red-500">*</span>
                </label>
                <Input
                  id="jumlahlantai"
                  name="jumlahlantai"
                  placeholder="Masukkan Jumlah Lantai"
                  value={formData.jumlahlantai}
                  onChange={handleChange}
                  className="h-10 lg:h-11 text-sm lg:text-base"
                />
                {errors.jumlahlantai && (
                  <p className="text-red-500 text-xs lg:text-sm mt-1">
                    {errors.jumlahlantai}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              {/* Lebar Depan */}
              <div>
                <label
                  htmlFor="lebardepan"
                  className="block font-bold mb-1.5 lg:mb-2 text-sm lg:text-base"
                >
                  Lebar Depan(m) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="lebardepan"
                  name="lebardepan"
                  placeholder="Masukkan Lebar Depan"
                  value={formData.lebardepan}
                  onChange={handleChange}
                  className="h-10 lg:h-11 text-sm lg:text-base"
                />
                {errors.lebardepan && (
                  <p className="text-red-500 text-xs lg:text-sm mt-1">
                    {errors.lebardepan}
                  </p>
                )}
              </div>
              {/* Panjang */}
              <div>
                <label
                  htmlFor="Panjang"
                  className="block font-bold mb-1.5 lg:mb-2 text-sm lg:text-base"
                >
                  Panjang(m) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="Panjang"
                  name="panjang"
                  placeholder="Masukkan Panjang"
                  value={formData.panjang}
                  onChange={handleChange}
                  className="h-10 lg:h-11 text-sm lg:text-base"
                />
                {errors.panjang && (
                  <p className="text-red-500 text-xs lg:text-sm mt-1">
                    {errors.panjang}
                  </p>
                )}
              </div>
              {/* Luas */}
              <div>
                <label
                  htmlFor="luas"
                  className="block font-bold mb-1.5 lg:mb-2 text-sm lg:text-base"
                >
                  Luas(m) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="luas"
                  name="luas"
                  placeholder="Masukkan Luas"
                  value={formData.luas}
                  onChange={handleChange}
                  className="h-10 lg:h-11 text-sm lg:text-base"
                />
                {errors.luas && (
                  <p className="text-red-500 text-xs lg:text-sm mt-1">
                    {errors.luas}
                  </p>
                )}
              </div>
            </div>

            {/* Harga Sewa */}
            <div>
              <label
                htmlFor="hargasewa"
                className="block font-bold mb-1.5 lg:mb-2 text-sm lg:text-base"
              >
                Harga Sewa (+PPH 10%) <span className="text-red-500">*</span>
              </label>
              <Input
                id="hargasewa"
                name="hargasewa"
                placeholder="Masukkan Harga Sewa"
                value={formData.hargasewa}
                onChange={handleChange}
                className="h-10 lg:h-11 text-sm lg:text-base"
              />
              {errors.hargasewa && (
                <p className="text-red-500 text-xs lg:text-sm mt-1">
                  {errors.hargasewa}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bagian Data Pemilik */}
        <div className="relative">
          <div className="absolute -top-3 lg:-top-4 left-4 lg:left-6 bg-red-600 text-white px-3 lg:px-4 py-1 lg:py-1.5 rounded shadow-md font-bold text-base lg:text-xl">
            Data Pemilik
          </div>
          <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded px-4 lg:px-8 pt-8 lg:pt-12 pb-4 lg:pb-6 space-y-4 lg:space-y-6">
            {/* Nama Pemilik */}
            <div>
              <label
                htmlFor="namapemilik"
                className="block font-bold mb-1.5 lg:mb-2 text-sm lg:text-base"
              >
                Nama Pemilik <span className="text-red-500">*</span>
              </label>
              <Input
                id="namapemilik"
                name="namapemilik"
                placeholder="Masukkan Nama Pemilik"
                value={formData.namapemilik}
                onChange={handleChange}
                className="h-10 lg:h-11 text-sm lg:text-base"
              />
              {errors.namapemilik && (
                <p className="text-red-500 text-xs lg:text-sm mt-1">
                  {errors.namapemilik}
                </p>
              )}
            </div>

            {/* Kontak Pemilik */}
            <div>
              <label
                htmlFor="kontakpemilik"
                className="block font-bold mb-1.5 lg:mb-2 text-sm lg:text-base"
              >
                Kontak Pemilik <span className="text-red-500">*</span>
              </label>
              <Input
                id="kontakpemilik"
                name="kontakpemilik"
                placeholder="Masukkan Kontak Pemilik"
                value={formData.kontakpemilik}
                onChange={handleChange}
                className="h-10 lg:h-11 text-sm lg:text-base"
              />
              {errors.kontakpemilik && (
                <p className="text-red-500 text-xs lg:text-sm mt-1">
                  {errors.kontakpemilik}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Form Kelengkapan */}
        <div className="relative">
          <div className="absolute -top-3 lg:-top-4 left-4 lg:left-6 bg-red-600 text-white px-3 lg:px-4 py-1 lg:py-1.5 rounded shadow-md font-bold text-base lg:text-xl">
            Form Kelengkapan
          </div>
          <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-lg p-4 lg:p-8 pt-8 lg:pt-12">
            <div>
              <FileUpload
                label="Upload Form Kelengkapan"
                name="formulok"
                value={formData.formulok}
                onChange={handleFileChange}
              />
              {errors.formulok && (
                <p className="text-red-500 text-xs lg:text-sm mt-1">
                  {errors.formulok}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tombol Submit - Full width di mobile, auto di desktop */}
        <div className="flex justify-end mb-4 lg:mb-6">
          <Button
            type="submit"
            variant="submit"
            className="w-full lg:w-auto p-4 lg:p-5 text-sm lg:text-base font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Usulan Lokasi"}
          </Button>
        </div>
      </form>

      <Dialog
        open={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-3xl h-[80vh] bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="p-4 border-b">
              <Dialog.Title className="text-base lg:text-lg font-medium">
                Pilih Lokasi dari Peta
              </Dialog.Title>
              <p className="text-xs lg:text-sm text-gray-500">
                Klik pada peta untuk memilih koordinat.
              </p>
            </div>
            <div className="h-[calc(100%-80px)]">
              {isMapOpen && <LocationPickerModal onConfirm={handleMapSelect} />}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
