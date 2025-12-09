"use client";

import { useState } from "react";
import { useAlert } from "@/components/shared/alertcontext";
import { UlokCreateSchema, UlokCreateInput } from "@/lib/validations/ulok";

interface UseAddUlokFormProps {
  onSubmit: (data: UlokCreateInput) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Custom Hook: useAddUlokForm
 * ---------------------------
 * Mengelola state dan logika bisnis untuk form penambahan ULOK baru.
 * Fitur:
 * - State Management form data
 * - Validasi manual & schema (Zod)
 * - Formatting input angka (ID locale)
 * - Integrasi dengan modal peta
 * - Reset bertingkat untuk dropdown wilayah
 */
export function useAddUlokForm({
  onSubmit,
  isSubmitting,
}: UseAddUlokFormProps) {
  const { showConfirmation, showToast } = useAlert();

  // Initial State Form
  const [formData, setFormData] = useState({
    namaUlok: "",
    provinsi: "",
    kabupaten: "",
    kecamatan: "",
    kelurahan: "",
    alamat: "",
    latlong: "", // String format "lat, long"
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
    formulok: null as File | null, // File upload
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMapOpen, setIsMapOpen] = useState(false); // Kontrol modal peta

  // Helper cek apakah string adalah angka valid
  const isNumber = (val: string) => {
    if (!val) return false;
    const normalized = val.replace(",", ".");
    return !isNaN(Number(normalized));
  };

  /**
   * Handler Input Text & Numeric
   * Menangani formatting khusus untuk field angka (ribuan titik, desimal koma).
   */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // 1. Handling Angka dengan Desimal (Lebar, Panjang, Luas)
    if (["lebardepan", "panjang", "luas"].includes(name)) {
      // Hapus titik ribuan lama
      let cleanValue = value.replace(/\./g, "");

      // Hanya izinkan angka dan satu koma
      let filtered = cleanValue.replace(/[^0-9,]/g, "");

      // Cegah multiple koma
      const parts = filtered.split(",");
      if (parts.length > 2) {
        filtered = parts[0] + "," + parts[1];
      }

      setFormData((prev) => ({ ...prev, [name]: filtered }));
      return;
    }

    // 2. Handling Angka Bulat (Lantai, Harga Sewa)
    if (name === "jumlahlantai" || name === "hargasewa") {
      // Hapus semua karakter non-digit
      const numericOnly = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericOnly }));
      return;
    }

    // 3. Default Handler (Text biasa)
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error saat user mengetik ulang
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Handler Input File
   */
  const handleFileChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, formulok: file }));
    if (errors["formulok"]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors["formulok"];
        return newErrors;
      });
    }
  };

  /**
   * Handler Dropdown Wilayah (Cascading Dropdown)
   * Saat parent berubah (misal Provinsi), child (Kabupaten, dll) di-reset.
   */
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

  /**
   * Callback dari Modal Peta
   * Mengupdate field latlong dengan format string.
   */
  const handleMapSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latlong: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    }));
    setIsMapOpen(false);
  };

  /**
   * Handler Submit Form
   */
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // --- TAHAP 1: VALIDASI MANUAL (Required Fields & File Type) ---
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
      formulok: "Form Kelengkapan wajib diisi",
    };

    const fieldErrors: Record<string, string> = {};

    Object.keys(requiredFields).forEach((field) => {
      const value = formData[field as keyof typeof formData];

      if (field === "formulok") {
        if (!value) {
          fieldErrors[field] =
            requiredFields[field as keyof typeof requiredFields];
        } else {
          // Validasi tipe file PDF
          const file = value as File;
          if (file.type !== "application/pdf") {
            fieldErrors[field] = "File harus berupa PDF";
          }
        }
      } else if (!value || value.toString().trim() === "") {
        fieldErrors[field] =
          requiredFields[field as keyof typeof requiredFields];
      }
    });

    // Validasi format latlong
    if (formData.latlong && !formData.latlong.includes(",")) {
      fieldErrors.latlong = "Format koordinat harus: latitude,longitude";
    }

    // Validasi numeric (NaN & Positive check)
    const numericFields = [
      "jumlahlantai",
      "lebardepan",
      "panjang",
      "luas",
      "hargasewa",
    ];
    numericFields.forEach((field) => {
      const value = formData[field as keyof typeof formData];
      if (value) {
        if (!isNumber(value.toString())) {
          fieldErrors[field] = `Input harus berupa angka`;
        } else if (
          Number(value.toString().replace(",", ".").replace(/\./g, "")) <= 0
        ) {
          fieldErrors[field] = `Angka harus lebih dari 0`;
        }
      }
    });

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    // Helper parser string (format Indo) -> number JS
    const parseNumber = (value: string) => {
      if (!value) return 0;
      const normalized = value.replace(/\./g, "").replace(",", ".");
      const parsed = Number(normalized);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Siapkan payload untuk validasi Zod
    const payloadToValidate = {
      nama_ulok: formData.namaUlok,
      provinsi: formData.provinsi,
      kabupaten: formData.kabupaten,
      kecamatan: formData.kecamatan,
      desa_kelurahan: formData.kelurahan,
      alamat: formData.alamat,
      latitude: Number(formData.latlong.split(",")[0]?.trim() || 0),
      longitude: Number(formData.latlong.split(",")[1]?.trim() || 0),
      format_store: formData.formatStore,
      bentuk_objek: formData.bentukObjek,
      alas_hak: formData.alasHak,
      jumlah_lantai: Number(formData.jumlahlantai),
      lebar_depan: parseNumber(formData.lebardepan),
      panjang: parseNumber(formData.panjang),
      luas: parseNumber(formData.luas),
      harga_sewa: Number(formData.hargasewa),
      nama_pemilik: formData.namapemilik,
      kontak_pemilik: formData.kontakpemilik,
      form_ulok: formData.formulok,
    };

    // --- TAHAP 2: VALIDASI ZOD ---
    const result = UlokCreateSchema.safeParse(payloadToValidate);

    if (!result.success) {
      const schemaErrors: Record<string, string> = {};
      // Mapping field schema Zod ke field name Form State
      const schemaFieldMap: Record<string, string> = {
        nama_ulok: "namaulok",
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
        form_ulok: "formulok",
      };

      result.error.issues.forEach((err) => {
        const schemaField = err.path[0] as string;
        const formField = schemaFieldMap[schemaField] || schemaField;
        if (!schemaErrors[formField]) {
          schemaErrors[formField] = err.message;
        }
      });

      setErrors(schemaErrors);
      showToast({
        type: "error",
        title: "Validasi Gagal",
        message: "Beberapa data tidak valid. Silakan periksa kembali.",
      });
      return;
    }

    // --- TAHAP 3: KONFIRMASI & SUBMIT ---
    const isConfirmed = await showConfirmation({
      title: "Konfirmasi Simpan Data",
      message: "Apakah Anda yakin semua data yang diisi sudah benar?",
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

  return {
    formData,
    errors,
    isMapOpen,
    isSubmitting,
    setIsMapOpen,
    handleChange,
    handleFileChange,
    handleWilayahChange,
    handleMapSelect,
    handleFormSubmit,
  };
}
