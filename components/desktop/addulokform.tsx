"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import CustomSelect from "@/components/ui/customselect";
import { Button } from "@/components/ui/button";
import WilayahSelector from "@/components/desktop/wilayahselector";
import { UlokCreateSchema, UlokCreateInput } from "@/lib/validations/ulok";
import { Dialog } from "@headlessui/react";
import { useAlert } from "@/components/desktop/alertcontext";
import dynamic from "next/dynamic";

interface TambahUlokFormProps {
  onSubmit: (data: UlokCreateInput) => Promise<void>;
  isSubmitting: boolean;
}

const LocationPickerModal = dynamic(
  () => import("@/components/map/LocationPickerMap"),
  { ssr: false }
);

export default function TambahUlokForm({
  onSubmit,
  isSubmitting,
}: TambahUlokFormProps) {
  const { showConfirmation, showToast } = useAlert();
  const [formData, setFormData] = useState({
    namaUlok: "",
    provinsi: "",
    kabupaten: "",
    kecamatan: "",
    kelurahan: "",
    alamat: "",
    latlong: "",
    formatStore: "",
    bentukObjek: "",
    alasHak: "",
    jumlahlantai: "",
    lebardepan: "",
    panjang: "",
    luas: "",
    hargasewa: "",
    namapemilik: "",
    kontakpemilik: "",
  });

  const formatStoreOptions = ["Reguler", "Super", "Spesifik", "Franchise"];
  const bentukObjekOptions = ["Tanah", "Bangunan"];
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isMapOpen, setIsMapOpen] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Hapus error untuk field yang sedang diubah
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleWilayahChange = (field: string, name: string) => {
    const updatedData: Record<string, any> = { [field]: name };
    if (field === "provinsi") {
      updatedData.kabupaten = "";
      updatedData.kecamatan = "";
      updatedData.kelurahan = "";
    } else if (field === "kabupaten") {
      updatedData.kecamatan = "";
      updatedData.kelurahan = "";
    } else if (field === "kecamatan") {
      updatedData.kelurahan = "";
    }
    setFormData((prev) => ({ ...prev, ...updatedData }));
  };

  const handleMapSelect = (lat: number, lng: number) => {
    // Fungsi ini akan memperbarui state 'formData' dengan koordinat baru
    setFormData((prev) => ({
      ...prev,
      latlong: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    }));
    setIsMapOpen(false); // Otomatis tutup modal setelah memilih
  };
  // --------------------

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrors({});
    const requiredFields = {
      namaUlok: "Nama ULOK wajib diisi",
      provinsi: "Provinsi wajib diisi",
      kabupaten: "Kabupaten wajib diisi",
      kecamatan: "Kecamatan wajib diisi",
      kelurahan: "Kelurahan wajib diisi",
      alamat: "Alamat wajib diisi",
      latlong: "Koordinat wajib diisi",
      formatStore: "Format Store wajib dipilih",
      bentukObjek: "Bentuk Objek wajib dipilih",
      alasHak: "Alas Hak wajib dipilih",
      jumlahlantai: "Jumlah Lantai wajib diisi",
      lebardepan: "Lebar Depan wajib diisi",
      panjang: "Panjang wajib diisi",
      luas: "Luas wajib diisi",
      hargasewa: "Harga Sewa wajib diisi",
      namapemilik: "Nama Pemilik wajib diisi",
      kontakpemilik: "Kontak Pemilik wajib diisi",
    };
    const fieldErrors: Record<string, string> = {};

    Object.keys(requiredFields).forEach((field) => {
      const value = formData[field as keyof typeof formData];
      if (!value || value.toString().trim() === "") {
        fieldErrors[field] =
          requiredFields[field as keyof typeof requiredFields];
      }
    });

    if (formData.latlong && !formData.latlong.includes(",")) {
      fieldErrors.latlong = "Format koordinat harus: latitude,longitude";
    }

    const numericFields = [
      "jumlahlantai",
      "lebardepan",
      "panjang",
      "luas",
      "hargasewa",
    ];
    numericFields.forEach((field) => {
      const value = formData[field as keyof typeof formData];
      if (value && isNaN(Number(value))) {
        fieldErrors[field] = `${field} harus berupa angka`;
      }
      if (value && Number(value) <= 0) {
        fieldErrors[field] = `${field} harus lebih dari 0`;
      }
    });

    // Jika ada error dari validasi manual, tampilkan dan stop
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    const parsedInput = {
      nama_ulok: formData.namaUlok,
      provinsi: formData.provinsi,
      kabupaten: formData.kabupaten,
      kecamatan: formData.kecamatan,
      desa_kelurahan: formData.kelurahan,
      alamat: formData.alamat,
      latitude: Number(formData.latlong.split(",")[0]) || 0,
      longitude: Number(formData.latlong.split(",")[1]) || 0,
      format_store: formData.formatStore,
      bentuk_objek: formData.bentukObjek,
      alas_hak: formData.alasHak,
      jumlah_lantai: Number(formData.jumlahlantai),
      lebar_depan: Number(formData.lebardepan),
      panjang: Number(formData.panjang),
      luas: Number(formData.luas),
      harga_sewa: Number(formData.hargasewa),
      nama_pemilik: formData.namapemilik,
      kontak_pemilik: formData.kontakpemilik,
    };

    const result = UlokCreateSchema.safeParse(parsedInput);

    if (!result.success) {
      const schemaErrors: Record<string, string> = {};
      const schemaFieldMap: Record<string, string> = {
        nama_ulok: "namaUlok",
        desa_kelurahan: "kelurahan",
        latitude: "latlong",
        longitude: "latlong",
        format_store: "formatStore",
        bentuk_objek: "bentukObjek",
        alas_hak: "alasHak",
        jumlah_lantai: "jumlahlantai",
        lebar_depan: "lebardepan",
        panjang: "panjang",
        luas: "luas",
        harga_sewa: "hargasewa",
        nama_pemilik: "namapemilik",
        kontak_pemilik: "kontakpemilik",
      };
      result.error.issues.forEach((err) => {
        const schemaField = err.path[0] as string;
        const formField = schemaFieldMap[schemaField] || schemaField;
        schemaErrors[formField] = err.message;
      });
      setErrors(schemaErrors);
      showToast({
        type: "error",
        title: "Validasi Gagal",
        message:
          "Beberapa data yang Anda masukkan tidak valid. Silakan periksa kembali.",
      });
      console.error("❌ Schema validasi gagal:", schemaErrors);
      return;
    }
    // 5. (BARU) Tampilkan dialog konfirmasi sebelum mengirim data
    const isConfirmed = await showConfirmation({
      title: "Konfirmasi Simpan Data",
      message:
        "Apakah Anda yakin semua data yang diisi sudah benar dan ingin menyimpannya?",
      type: "success",
      confirmText: "Ya, Simpan",
      cancelText: "Batal",
    });

    if (isConfirmed) {
      try {
        await onSubmit(result.data);
      } catch (error) {
        console.error("❌ Gagal submit:", error);
        showToast({
          type: "error",
          title: "Proses Gagal",
          message:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat mengirim data.",
        });
      }
    }
  };

  return (
    <>
      <form
        onSubmit={handleFormSubmit}
        className="space-y-10 max-w-7xl mx-auto"
      >
        {/* Bagian Data Lokasi */}
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
                <p className="text-red-500 text-sm mt-1">{errors.namaUlok}</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Latlong */}
              <div>
                <label htmlFor="latlong" className="block font-bold mb-1">
                  LatLong <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="latlong"
                    name="latlong"
                    placeholder="Masukkan LatLong"
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
                <p className="mt-2 text-xs text-gray-500 italic">
                  <strong>Catatan:</strong> Jika ikon peta tidak berfungsi,
                  masukkan koordinat manual dengan format:
                  <br />
                  <code className="bg-gray-200 px-1 rounded">
                    -6.2257, 106.6570
                  </code>{" "}
                  (Latitude Y, Longitude X).
                </p>
                {errors.latlong && (
                  <p className="text-red-500 text-sm mt-1">{errors.latlong}</p>
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
                  <p className="text-red-500 text-sm mt-1">{errors.alasHak}</p>
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
                <label htmlFor="lebardepan" className="block font-bold mb-1">
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
                  <p className="text-red-500 text-sm mt-1">{errors.panjang}</p>
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
                Harga Sewa (+PPH 10%) <span className="text-red-500">*</span>
              </label>
              <Input
                id="hargasewa"
                name="hargasewa"
                placeholder="Masukkan Harga Sewa"
                value={formData.hargasewa}
                onChange={handleChange}
              />
              {errors.hargasewa && (
                <p className="text-red-500 text-sm mt-1">{errors.hargasewa}</p>
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
              <label htmlFor="kontakpemilik" className="block font-bold mb-1">
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

        {/* Tombol Submit */}
        <div className="flex justify-end mt-6">
          <Button
            variant="submit"
            className="w-full sm:w-[200px] md:w-[268px] h-[42px] hover:bg-[hsl(145.44,63.2%,42%)]"
            onClick={handleFormSubmit}
          >
            Submit
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
              <Dialog.Title className="text-lg font-medium">
                Pilih Lokasi dari Peta
              </Dialog.Title>
              <p className="text-sm text-gray-500">
                Klik pada peta untuk memilih koordinat.
              </p>
            </div>
            <div className="h-[calc(100%-80px)]">
              {/* Panggil komponen peta di sini */}
              {isMapOpen && <LocationPickerModal onConfirm={handleMapSelect} />}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
