// hooks/useDetailUlokForm.tsx
import { useState, useEffect } from "react";
import { MappedUlokData } from "@/hooks/ulok/useUlokDetail";
import { UlokUpdateSchema, UlokUpdateInput } from "@/lib/validations/ulok";

// Type definition: Data yang bisa dikirim (JSON atau FormData)
type SaveData = UlokUpdateInput | FormData;

/**
 * Helper: Mengubah titik menjadi koma (Format Desimal Indonesia).
 * Digunakan saat menampilkan data numeric dari API ke Input Field.
 * Contoh: 10.5 -> "10,5"
 */
const convertkoma = (val: any) => {
  if (val === null || val === undefined || val === "") return "";
  const s = String(val);
  return s.replace(".", ",");
};

/**
 * Helper: Mengubah format input (ribuan titik, desimal koma) ke Number JS standar.
 * Digunakan sebelum validasi/pengiriman data.
 * Contoh: "1.000,50" -> 1000.50
 */
const parseKomaToNumber = (val: any) => {
  if (val === null || val === undefined || val === "") return 0;
  const s = String(val).replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return isNaN(n) ? 0 : n;
};

/**
 * Custom Hook: useDetailUlokForm
 * ------------------------------
 * Mengelola state form edit detail ULOK.
 * * @param initialData - Data awal ULOK yang diambil dari API.
 * @param onSave - Callback function untuk menyimpan data ke server.
 */
export function useDetailUlokForm(
  initialData: MappedUlokData | null | undefined,
  onSave: (data: SaveData) => Promise<boolean>
) {
  const [isEditing, setIsEditing] = useState(false); // Mode Edit Toggle
  const [editedData, setEditedData] = useState<any>(initialData || {}); // State Form
  const [errors, setErrors] = useState<Record<string, string | undefined>>({}); // State Error Validasi
  const [newFormUlokFile, setNewFormUlokFile] = useState<File | null>(null); // State File Upload Baru

  // Efek: Sinkronisasi data awal ke state form saat data dimuat/berubah
  useEffect(() => {
    if (!initialData) {
      setEditedData(initialData || {});
      return;
    }

    // Konversi data numerik dari API ke format String Indonesia (koma) untuk input field
    const converted = {
      ...initialData,
      lebardepan:
        initialData.lebardepan !== null && initialData.lebardepan !== undefined
          ? convertkoma(initialData.lebardepan)
          : "",
      panjang:
        initialData.panjang !== null && initialData.panjang !== undefined
          ? convertkoma(initialData.panjang)
          : "",
      luas:
        initialData.luas !== null && initialData.luas !== undefined
          ? convertkoma(initialData.luas)
          : "",
      hargasewa:
        initialData.hargasewa !== null && initialData.hargasewa !== undefined
          ? String(initialData.hargasewa)
          : "",
    };

    setEditedData(converted);
  }, [initialData]);

  // Handler perubahan file input
  const handleFileChange = (file: File | null) => {
    setNewFormUlokFile(file);
  };

  /**
   * Handler Input Change Utama.
   * Menangani formatting khusus untuk field numerik, koordinat, dan text biasa.
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    // 1. Handling Angka Desimal (Lebar, Panjang, Luas)
    if (["lebardepan", "panjang", "luas"].includes(name)) {
      // Hanya izinkan angka, titik, dan koma
      let filtered = value.replace(/[^0-9.,]/g, "");
      // Pastikan format desimal konsisten menggunakan koma
      filtered = filtered.replace(".", ",");
      // Cegah multiple koma
      const parts = filtered.split(",");
      if (parts.length > 2) filtered = parts[0] + "," + parts[1];

      setEditedData((prev: any) => ({ ...prev, [name]: filtered }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
      return;
    }

    // 2. Handling Harga Sewa (Angka Bulat)
    if (name === "hargasewa") {
      const cleanValue = value.replace(/[^0-9]/g, "");
      setEditedData((prev: any) => ({ ...prev, [name]: cleanValue }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
      return;
    }

    // 3. Handling Koordinat (Lat, Long)
    if (name === "latlong") {
      const coords = value.split(",").map((coord) => coord.trim());
      const latStr = coords[0] || "";
      const longStr = coords[1] || "";
      const latitude = parseFloat(latStr);
      const longitude = parseFloat(longStr);

      setEditedData((prev: any) => ({
        ...prev,
        latitude: !isNaN(latitude) ? latitude : null,
        longitude: !isNaN(longitude) ? longitude : null,
      }));

      // Clear error lat/long jika input valid
      if (errors.latitude || errors.longitude) {
        setErrors((prev) => ({
          ...prev,
          latitude: undefined,
          longitude: undefined,
        }));
      }
      return;
    }

    // 4. Default Handler (Text & Standard Number)
    let finalValue: string | number | null = value;
    if (type === "number") {
      if (value === "") {
        finalValue = null;
      } else {
        const parsedNumber = parseFloat(value);
        finalValue = !isNaN(parsedNumber) ? parsedNumber : null;
      }
    }

    setEditedData((prev: any) => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Handler perubahan dropdown select
  const handleSelectChange = (name: string, value: string) => {
    setEditedData((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  /**
   * Wrapper Fungsi Simpan.
   * Melakukan parsing data, validasi schema, pembuatan FormData, dan pemanggilan API.
   */
  const handleSaveWrapper = async () => {
    // 1. Parsing & Cleaning Data sebelum validasi
    const lebardepan = parseKomaToNumber(editedData.lebardepan);
    const panjang = parseKomaToNumber(editedData.panjang);
    const luas = parseKomaToNumber(editedData.luas);
    const cleanedHargaSewa = editedData.hargasewa
      ? parseInt(String(editedData.hargasewa).replace(/[^0-9]/g, ""), 10)
      : 0;

    // Persiapkan object data bersih untuk divalidasi Zod
    const dataToValidate = {
      nama_ulok: editedData.namaUlok,
      desa_kelurahan: editedData.kelurahan,
      kecamatan: editedData.kecamatan,
      kabupaten: editedData.kabupaten,
      provinsi: editedData.provinsi,
      alamat: editedData.alamat,
      latitude: editedData.latitude,
      longitude: editedData.longitude,
      format_store: editedData.formatStore,
      bentuk_objek: editedData.bentukObjek,
      alas_hak: editedData.alasHak,
      jumlah_lantai: editedData.jumlahlantai,
      lebar_depan: lebardepan,
      panjang,
      luas,
      harga_sewa: cleanedHargaSewa,
      nama_pemilik: editedData.namapemilik,
      kontak_pemilik: editedData.kontakpemilik,
    };

    // 2. Validasi Schema (Zod)
    const validationResult = UlokUpdateSchema.safeParse(dataToValidate);
    if (!validationResult.success) {
      const formattedErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const key = issue.path[0] as string;
        formattedErrors[key] = issue.message;
      }
      setErrors(formattedErrors);
      console.error("Validation Failed:", formattedErrors);
      return;
    }

    // 3. Konstruksi FormData (Multipart)
    // Diperlukan karena kita mengirim file (jika ada) bersama data teks.
    const formData = new FormData();

    // 4. Append File Baru (jika ada)
    if (newFormUlokFile) {
      formData.append("form_ulok", newFormUlokFile);
    }

    // 5. Append Data Teks yang sudah tervalidasi
    for (const [key, value] of Object.entries(validationResult.data)) {
      if (value !== null && value !== undefined) {
        // Konversi semua nilai ke string agar aman masuk FormData
        formData.append(key, String(value));
      }
    }

    // 6. Eksekusi Simpan ke API
    const success = await onSave(formData);
    if (success) {
      setIsEditing(false); // Keluar mode edit
      setNewFormUlokFile(null); // Reset file input
    }
  };

  /**
   * Handler Batal Edit.
   * Mengembalikan state form ke kondisi awal (Initial Data).
   */
  const handleCancel = () => {
    if (!initialData) {
      setEditedData({});
    } else {
      // Re-apply formatting koma ke data awal
      setEditedData({
        ...initialData,
        lebardepan:
          initialData.lebardepan !== null &&
          initialData.lebardepan !== undefined
            ? convertkoma(initialData.lebardepan)
            : "",
        panjang:
          initialData.panjang !== null && initialData.panjang !== undefined
            ? convertkoma(initialData.panjang)
            : "",
        luas:
          initialData.luas !== null && initialData.luas !== undefined
            ? convertkoma(initialData.luas)
            : "",
        hargasewa:
          initialData.hargasewa !== null && initialData.hargasewa !== undefined
            ? String(initialData.hargasewa)
            : "",
      });
    }

    setErrors({});
    setIsEditing(false);
    setNewFormUlokFile(null);
  };

  return {
    isEditing,
    setIsEditing,
    editedData,
    errors,
    newFormUlokFile,
    handleFileChange,
    handleInputChange,
    handleSelectChange,
    handleSaveWrapper,
    handleCancel,
  };
}
