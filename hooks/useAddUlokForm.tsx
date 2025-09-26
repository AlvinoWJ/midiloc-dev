"use client";

import { useState } from "react";
import { useAlert } from "@/components/desktop/alertcontext";
import { UlokCreateSchema, UlokCreateInput } from "@/lib/validations/ulok";

interface UseAddUlokFormProps {
  onSubmit: (data: UlokCreateInput) => Promise<void>;
  isSubmitting: boolean;
}

export function useAddUlokForm({
  onSubmit,
  isSubmitting,
}: UseAddUlokFormProps) {
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
    formulok: null as File | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMapOpen, setIsMapOpen] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // handler khusus untuk file upload
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
    setFormData((prev) => ({
      ...prev,
      latlong: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    }));
    setIsMapOpen(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // --- VALIDASI MANUAL
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
          // ✅ validasi tambahan: hanya PDF
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

    // Cek format latlong
    if (formData.latlong && !formData.latlong.includes(",")) {
      fieldErrors.latlong = "Format koordinat harus: latitude,longitude";
    }

    // Cek field numerik
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
        if (isNaN(Number(value))) {
          fieldErrors[field] = `Input harus berupa angka`;
        } else if (Number(value) <= 0) {
          fieldErrors[field] = `Angka harus lebih dari 0`;
        }
      }
    });

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    // --- VALIDASI ZOD
    const result = UlokCreateSchema.safeParse({
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
      lebar_depan: Number(formData.lebardepan),
      panjang: Number(formData.panjang),
      luas: Number(formData.luas),
      harga_sewa: Number(formData.hargasewa),
      nama_pemilik: formData.namapemilik,
      kontak_pemilik: formData.kontakpemilik,
      form_ulok: formData.formulok,
    });

    if (!result.success) {
      const schemaErrors: Record<string, string> = {};
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
