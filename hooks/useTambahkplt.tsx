"use client";

import { useState, useEffect } from "react";
import { useAlert } from "@/components/desktop/alertcontext"; // Pastikan path ini benar
import {
  KpltCreatePayload,
  KpltCreatePayloadSchema,
} from "@/lib/validations/kplt";
import { PrefillKpltResponse } from "@/types/common";

// Definisikan props untuk hook (Tidak Diubah)
interface UseTambahKpltProps {
  onSubmit: (data: KpltCreatePayload) => Promise<void>;
  isSubmitting: boolean;
  initialData?: PrefillKpltResponse | null;
}

// Tipe untuk state error (Tidak Diubah)
type FormErrors = Partial<Record<keyof KpltCreatePayload, string>>;

export function useTambahKplt({
  onSubmit,
  isSubmitting,
  initialData,
}: UseTambahKpltProps) {
  const { showConfirmation, showToast } = useAlert();

  // --- 1. State Management Eksplisit (Tidak Diubah) ---
  const [formData, setFormData] = useState({
    nama_kplt: "",
    latitude: "",
    longitude: "",
    karakter_lokasi: "",
    sosial_ekonomi: "",
    skor_fpl: "",
    std: "",
    apc: "",
    spd: "",
    pe_status: "",
    pe_rab: "",
    progress_toko: "",
    pdf_foto: null as File | null,
    counting_kompetitor: null as File | null,
    pdf_pembanding: null as File | null,
    pdf_kks: null as File | null,
    excel_fpl: null as File | null,
    excel_pe: null as File | null,
    pdf_form_ukur: null as File | null,
    video_traffic_siang: null as File | null,
    video_traffic_malam: null as File | null,
    video_360_siang: null as File | null,
    video_360_malam: null as File | null,
    peta_coverage: null as File | null,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // --- Efek untuk mengisi form dari initialData (Tidak Diubah) ---
  useEffect(() => {
    if (initialData?.base) {
      setFormData((prev) => ({
        ...prev,
        nama_kplt: initialData.base.nama_kplt || "",
        latitude: initialData.base.latitude?.toString() || "",
        longitude: initialData.base.longitude?.toString() || "",
      }));
    }
  }, [initialData]);

  // --- 2. Handlers (Tidak Diubah) ---
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormErrors];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target; // Ambil 'name' dan 'files' dari event.

    if (files && files.length > 0) {
      const selectedFile = files[0];
      // Set state formData dengan file yang baru dipilih
      setFormData((prev) => ({ ...prev, [name]: selectedFile }));
    } else {
      // Jika user membatalkan pilihan file, set state kembali ke null
      setFormData((prev) => ({ ...prev, [name]: null }));
    }

    // Hapus error untuk field ini jika ada
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormErrors];
        return newErrors;
      });
    }
  };

  // --- 3. Submission & Validation (DIREVISI DI SINI) ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // --- VALIDASI MANUAL (BLOK BARU) ---
    const requiredFields = {
      karakter_lokasi: "Karakter Lokasi wajib diisi",
      sosial_ekonomi: "Sosial Ekonomi wajib diisi",
      skor_fpl: "Skor FPL wajib diisi",
      std: "STD wajib diisi",
      apc: "APC wajib diisi",
      spd: "SPD wajib diisi",
      pe_status: "PE Status wajib diisi",
      pe_rab: "PE RAB wajib diisi",
      pdf_foto: "PDF Foto wajib diunggah",
      counting_kompetitor: "Counting Kompetitor wajib diunggah",
      pdf_pembanding: "PDF Pembanding wajib diunggah",
      pdf_kks: "PDF KKS wajib diunggah",
      excel_fpl: "Excel FPL wajib diunggah",
      excel_pe: "Excel PE wajib diunggah",
      pdf_form_ukur: "PDF Form Ukur wajib diunggah",
      video_traffic_siang: "Video Traffic Siang wajib diunggah",
      video_traffic_malam: "Video Traffic Malam wajib diunggah",
      video_360_siang: "Video 360 Siang wajib diunggah",
      video_360_malam: "Video 360 Malam wajib diunggah",
      peta_coverage: "Peta Coverage wajib diunggah",
    };

    const fieldErrors: FormErrors = {};
    const fileFields = [
      "pdf_foto",
      "counting_kompetitor",
      "pdf_pembanding",
      "pdf_kks",
      "excel_fpl",
      "excel_pe",
      "pdf_form_ukur",
      "video_traffic_siang",
      "video_traffic_malam",
      "video_360_siang",
      "video_360_malam",
      "peta_coverage",
    ];

    Object.keys(requiredFields).forEach((field) => {
      const key = field as keyof typeof requiredFields;
      const value = formData[key];

      if (fileFields.includes(key)) {
        if (!value) {
          fieldErrors[key] = requiredFields[key];
        }
      } else if (!value || String(value).trim() === "") {
        fieldErrors[key] = requiredFields[key];
      }
    });

    const numericFields = ["skor_fpl", "std", "apc", "spd", "pe_rab"];
    numericFields.forEach((field) => {
      const key = field as keyof typeof formData;
      const value = formData[key];
      if (value && isNaN(Number(value))) {
        fieldErrors[key] = `Input harus berupa angka`;
      }
    });

    // ▼▼▼ TAMBAHKAN BLOK DEBUGGING INI DI SINI ▼▼▼
    //======================================================================
    console.log("--- DEBUGGING VALIDASI MANUAL ---");
    console.log("State formData saat submit:", formData);
    console.log("Daftar error yang ditemukan:", fieldErrors);
    console.log("Apakah ada error?", Object.keys(fieldErrors).length > 0);
    //======================================================================

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      showToast({
        type: "error",
        title: "Validasi Gagal",
        message: "Beberapa data wajib diisi atau tidak valid.",
      });
      return; // Hentikan proses jika ada error manual
    }
    // --- AKHIR BLOK VALIDASI MANUAL ---

    // --- VALIDASI ZOD (Tetap berjalan setelah validasi manual lolos) ---
    const payloadToValidate = {
      ...formData,
      pdf_foto: formData.pdf_foto?.name,
      counting_kompetitor: formData.counting_kompetitor?.name,
      pdf_pembanding: formData.pdf_pembanding?.name,
      pdf_kks: formData.pdf_kks?.name,
      excel_fpl: formData.excel_fpl?.name,
      excel_pe: formData.excel_pe?.name,
      pdf_form_ukur: formData.pdf_form_ukur?.name,
      video_traffic_siang: formData.video_traffic_siang?.name,
      video_traffic_malam: formData.video_traffic_malam?.name,
      video_360_siang: formData.video_360_siang?.name,
      video_360_malam: formData.video_360_malam?.name,
      peta_coverage: formData.peta_coverage?.name,
      progress_toko:
        formData.progress_toko === "" ? null : formData.progress_toko,
    };

    const result = KpltCreatePayloadSchema.safeParse(payloadToValidate);

    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof KpltCreatePayload;
        if (!newErrors[fieldName]) newErrors[fieldName] = issue.message;
      });
      setErrors(newErrors);
      showToast({
        type: "error",
        title: "Validasi Gagal",
        message: "Data yang Anda masukkan belum lengkap atau tidak valid.",
      });
      return;
    }

    // --- Konfirmasi dan Submit (Tidak Diubah) ---
    const isConfirmed = await showConfirmation({
      title: "Konfirmasi Simpan KPLT",
      message: "Apakah Anda yakin data yang diisi sudah benar?",
      type: "success",
    });

    if (isConfirmed) {
      try {
        await onSubmit(result.data);
      } catch (error) {
        showToast({
          type: "error",
          title: "Proses Gagal",
          message:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan server.",
        });
      }
    }
  };

  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleFileChange,
    handleFormSubmit,
  };
}
