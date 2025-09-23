"use client";

import { Input } from "@/components/ui/input";
import { MapPin, ArrowLeft } from "lucide-react";
import CustomSelect from "@/components/ui/customselect";
import { Button } from "@/components/ui/button";
import WilayahSelector from "@/components/desktop/wilayahselector"; // Bisa digunakan kembali jika responsif
import { UlokCreateInput } from "@/lib/validations/ulok";
import { Dialog } from "@headlessui/react";
import dynamic from "next/dynamic";
import { useAddUlokForm } from "@/hooks/useAddUlokForm"; // Import hook
import MobileSidebar from "./sidebar";
import MobileNavbar from "./navbar";
import { useRouter } from "next/navigation";

interface TambahUlokFormProps {
  onSubmit: (data: UlokCreateInput) => Promise<void>;
  isSubmitting: boolean;
}

const LocationPickerModal = dynamic(
  () => import("@/components/map/LocationPickerMap"),
  { ssr: false }
);

export default function AddUlokFormMobile({
  onSubmit,
  isSubmitting,
}: TambahUlokFormProps) {
  const {
    formData,
    errors,
    isMapOpen,
    setIsMapOpen,
    handleChange,
    handleWilayahChange,
    handleMapSelect,
    handleFormSubmit,
  } = useAddUlokForm({ onSubmit, isSubmitting });
  const router = useRouter();

  const formatStoreOptions = ["Reguler", "Super", "Spesifik", "Franchise"];
  const bentukObjekOptions = ["Tanah", "Bangunan"];

  return (
    <div className="bg-gray-50 min-h-screen">
      <MobileSidebar />
      <MobileNavbar />
      <form onSubmit={handleFormSubmit} className="space-y-6 p-4">
        <Button onClick={() => router.back()} variant="back">
          <ArrowLeft size={20} className="mr-1" />
          Kembali
        </Button>
        {/* === BAGIAN DATA LOKASI === */}
        <div className="bg-white shadow rounded px-4 pt-4 pb-8 space-y-4">
          <h2 className="text-xl font-bold text-black border-b pb-2">
            Data Lokasi
          </h2>
          <div>
            <label className="block font-semibold text-base mb-1">
              Nama ULOK <span className="text-primary">*</span>
            </label>
            <Input
              name="namaUlok"
              placeholder="Masukkan nama ULOK"
              value={formData.namaUlok}
              onChange={handleChange}
            />
            {errors.namaUlok && (
              <p className="text-red-500 text-xs mt-1">{errors.namaUlok}</p>
            )}
          </div>

          <WilayahSelector
            onWilayahChange={handleWilayahChange}
            errors={errors}
          />

          {/* Alamat */}
          <div>
            <label className="block font-semibold text-base mb-1">
              Alamat <span className="text-red-500">*</span>
            </label>
            <textarea
              name="alamat"
              placeholder="Alamat lengkap"
              value={formData.alamat}
              onChange={handleChange}
              rows={3}
              className="w-full text-base px-3 py-1 border border-gray-300 rounded shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
            {errors.alamat && (
              <p className="text-red-500 text-xs mt-1">{errors.alamat}</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-base mb-1">
              LatLong <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <Input
                name="latlong"
                placeholder="-6.175, 106.828"
                value={formData.latlong}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setIsMapOpen(true)}
                className="p-2 border rounded-md"
              >
                <MapPin className="text-red-500" size={18} />
              </button>
            </div>
            {errors.latlong && (
              <p className="text-red-500 text-xs mt-1">{errors.latlong}</p>
            )}
          </div>
        </div>

        {/* === BAGIAN DATA STORE === */}
        <div className="bg-white shadow rounded px-4 pt-4 pb-8 space-y-4">
          <h2 className="text-xl font-bold text-black border-b pb-2">
            Data Store
          </h2>
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
          <CustomSelect
            id="alasHak"
            name="alasHak"
            label="Alas Hak"
            placeholder="Pilih Alas Hak"
            value={formData.alasHak}
            options={["true", "false"]}
            onChange={handleChange}
            error={errors.alasHak}
          />
          <div>
            <label className="block font-semibold text-base mb-1">
              Jumlah Lantai <span className="text-red-500">*</span>
            </label>
            <Input
              name="jumlahlantai"
              placeholder="0"
              type="number"
              value={formData.jumlahlantai}
              onChange={handleChange}
            />
            {errors.jumlahlantai && (
              <p className="text-red-500 text-xs mt-1">{errors.jumlahlantai}</p>
            )}
          </div>
          <div>
            <label className="block font-semibold text-base mb-1">
              Lebar Depan(m) <span className="text-red-500">*</span>
            </label>
            <Input
              name="lebardepan"
              placeholder="0"
              type="number"
              value={formData.lebardepan}
              onChange={handleChange}
            />
            {errors.lebardepan && (
              <p className="text-red-500 text-xs mt-1">{errors.lebardepan}</p>
            )}
          </div>
          <div>
            <label className="block font-semibold text-base mb-1">
              Panjang(m) <span className="text-red-500">*</span>
            </label>
            <Input
              name="panjang"
              placeholder="0"
              type="number"
              value={formData.panjang}
              onChange={handleChange}
            />
            {errors.panjang && (
              <p className="text-red-500 text-xs mt-1">{errors.panjang}</p>
            )}
          </div>
          <div>
            <label className="block font-semibold text-base mb-1">
              Luas(m²) <span className="text-red-500">*</span>
            </label>
            <Input
              name="luas"
              placeholder="0"
              type="number"
              value={formData.luas}
              onChange={handleChange}
            />
            {errors.luas && (
              <p className="text-red-500 text-xs mt-1">{errors.luas}</p>
            )}
          </div>
          <div>
            <label className="block font-semibold text-base mb-1">
              Harga Sewa (+PPH 10%) <span className="text-red-500">*</span>
            </label>
            <Input
              name="hargasewa"
              placeholder="0"
              type="number"
              value={formData.hargasewa}
              onChange={handleChange}
            />
            {errors.hargasewa && (
              <p className="text-red-500 text-xs mt-1">{errors.hargasewa}</p>
            )}
          </div>
        </div>

        {/* === BAGIAN DATA PEMILIK === */}
        <div className="bg-white shadow rounded px-4 pt-4 pb-8 space-y-4">
          <h2 className="text-xl font-bold text-black border-b pb-2">
            Data Pemilik
          </h2>
          <div>
            <label className="block font-semibold text-base mb-1">
              Nama Pemilik <span className="text-red-500">*</span>
            </label>
            <Input
              name="namapemilik"
              placeholder="Masukkan Nama Pemilik"
              value={formData.namapemilik}
              onChange={handleChange}
            />
            {errors.namapemilik && (
              <p className="text-red-500 text-xs mt-1">{errors.namapemilik}</p>
            )}
          </div>
          <div>
            <label className="block font-semibold text-base mb-1">
              Kontak Pemilik <span className="text-red-500">*</span>
            </label>
            <Input
              name="kontakpemilik"
              placeholder="Masukkan Kontak Pemilik"
              value={formData.kontakpemilik}
              onChange={handleChange}
            />
            {errors.kontakpemilik && (
              <p className="text-red-500 text-xs mt-1">
                {errors.kontakpemilik}
              </p>
            )}
          </div>
        </div>

        <div className="mt-0">
          <Button
            type="submit"
            variant="submit"
            size="lg"
            className="w-full rounded-xl"
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
            {isMapOpen && <LocationPickerModal onConfirm={handleMapSelect} />}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
