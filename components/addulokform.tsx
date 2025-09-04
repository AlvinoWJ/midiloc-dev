"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import CustomSelect from "@/components/ui/customselect";
import { Button } from "@/components/ui/button";
import { UlokCreateSchema } from "@/lib/validations/ulok";
import { useRouter } from "next/navigation";

const AddUlokForm: React.FC = () => {
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
  const router = useRouter();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      console.error("❌ Validasi manual gagal:", fieldErrors);
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
      alas_hak: formData.alasHak === "true",
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
      // Map error dari schema ke nama field di form
      const schemaFieldMap: Record<string, string> = {
        nama_ulok: "namaUlok",
        provinsi: "provinsi",
        kabupaten: "kabupaten",
        kecamatan: "kecamatan",
        desa_kelurahan: "kelurahan",
        alamat: "alamat",
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

      const schemaErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const schemaField = err.path[0] as string;
        const formField = schemaFieldMap[schemaField] || schemaField;
        schemaErrors[formField] = err.message;
      });

      setErrors(schemaErrors);
      console.error("❌ Schema validasi gagal:", schemaErrors);
      console.log("Detail issues:", result.error.issues);
      return;
    }

    // Jika semua validasi berhasil, submit data
    console.log("✅ Data valid:", result.data);
    setErrors({});

    try {
      const response = await fetch("/api/ulok", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result.data),
      });

      const resJson = await response.json();

      if (!response.ok) {
        console.error("❌ Gagal submit:", resJson.error || resJson);
        alert(resJson.error || "Terjadi kesalahan");
      } else {
        console.log("✅ Berhasil submit:", resJson.data);
        alert("Data berhasil disimpan");
        router.push("/usulan_lokasi");

        // Reset form setelah berhasil submit
        setFormData({
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
      }
    } catch (err) {
      console.error("❌ Error fetch:", err);
      alert("Gagal menghubungi server");
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto">
      <form className="mt-10 relative max-w-7xl mx-auto">
        <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded shadow-md font-semibold">
          Data Store
        </div>
        <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded p-6 space-y-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-4">
            {/* Provinsi */}
            <div>
              <label htmlFor="provinsi" className="block font-bold mb-1">
                Provinsi <span className="text-red-500">*</span>
              </label>
              <Input
                id="provinsi"
                name="provinsi"
                placeholder="Masukkan provinsi"
                value={formData.provinsi}
                onChange={handleChange}
              />
              {errors.provinsi && (
                <p className="text-red-500 text-sm mt-1">{errors.provinsi}</p>
              )}
            </div>

            {/* Kabupaten/Kota */}
            <div>
              <label htmlFor="kabupaten" className="block font-bold mb-1">
                Kabupaten/Kota <span className="text-red-500">*</span>
              </label>
              <Input
                id="kabupaten"
                name="kabupaten"
                placeholder="Masukkan kabupaten/kota"
                value={formData.kabupaten}
                onChange={handleChange}
              />
              {errors.kabupaten && (
                <p className="text-red-500 text-sm mt-1">{errors.kabupaten}</p>
              )}
            </div>

            {/* Kecamatan */}
            <div>
              <label htmlFor="kecamatan" className="block font-bold mb-1">
                Kecamatan <span className="text-red-500">*</span>
              </label>
              <Input
                id="kecamatan"
                name="kecamatan"
                placeholder="Masukkan kecamatan"
                value={formData.kecamatan}
                onChange={handleChange}
              />
              {errors.kecamatan && (
                <p className="text-red-500 text-sm mt-1">{errors.kecamatan}</p>
              )}
            </div>

            {/* Kelurahan */}
            <div>
              <label htmlFor="kelurahan" className="block font-bold mb-1">
                Kelurahan/Desa <span className="text-red-500">*</span>
              </label>
              <Input
                id="kelurahan"
                name="kelurahan"
                placeholder="Masukkan kelurahan/desa"
                value={formData.kelurahan}
                onChange={handleChange}
              />
              {errors.kelurahan && (
                <p className="text-red-500 text-sm mt-1">{errors.kelurahan}</p>
              )}
            </div>
          </div>

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
              <div className="relative">
                <Input
                  id="latlong"
                  name="latlong"
                  placeholder="Masukkan LatLong"
                  value={formData.latlong}
                  onChange={handleChange}
                  className="pr-10"
                />
                <MapPin
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"
                  size={18}
                />
              </div>
              {errors.latlong && (
                <p className="text-red-500 text-sm mt-1">{errors.latlong}</p>
              )}
            </div>
          </div>
        </div>
      </form>

      {/*Data Store */}
      <form className="mt-10 relative max-w-7xl mx-auto">
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
                <p className="text-red-500 text-sm mt-1">{errors.lebardepan}</p>
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
      </form>

      {/*Data Pemilik */}
      <form className="mt-10 relative max-w-7xl mx-auto">
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
              <p className="text-red-500 text-sm mt-1">{errors.namapemilik}</p>
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
      </form>
      <div className="flex justify-end mt-6">
        <Button
          variant="submit"
          className="w-full sm:w-[200px] md:w-[268px] h-[42px] hover:bg-[hsl(145.44,63.2%,42%)]"
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default AddUlokForm;
