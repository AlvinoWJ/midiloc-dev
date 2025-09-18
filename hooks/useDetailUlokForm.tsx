// hooks/useDetailUlokForm.ts //untuk menyimpan fungsi
import { useState, useEffect } from "react";
import { MappedUlokData } from "@/hooks/useUlokDetail";
import { UlokUpdateSchema, UlokUpdateInput } from "@/lib/validations/ulok";

export function useDetailUlokForm(
  initialData: MappedUlokData,
  onSave: (data: UlokUpdateInput) => Promise<boolean>
) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    setEditedData(initialData);
  }, [initialData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (name === "latlong") {
      // 💡 Logika pemisahan yang lebih aman
      const coords = value.split(",").map((coord) => coord.trim());
      const latStr = coords[0] || ""; // Ambil bagian pertama, default string kosong
      const longStr = coords[1] || ""; // Ambil bagian kedua, default string kosong

      // parseFloat akan menghasilkan NaN jika string kosong atau tidak valid
      const latitude = parseFloat(latStr);
      const longitude = parseFloat(longStr);

      setEditedData((prev) => ({
        ...prev,
        // Jika hasil parse bukan angka (NaN), simpan sebagai null
        latitude: !isNaN(latitude) ? latitude : null,
        longitude: !isNaN(longitude) ? longitude : null,
      }));

      if (errors.latitude || errors.longitude) {
        setErrors((prev) => ({
          ...prev,
          latitude: undefined,
          longitude: undefined,
        }));
      }
    } else {
      // Penanganan untuk semua input lainnya
      let finalValue: string | number | null = value;

      if (type === "number") {
        // Jika input angka dikosongkan, set nilainya jadi null
        if (value === "") {
          finalValue = null;
        } else {
          const parsedNumber = parseFloat(value);
          // Konversi ke angka hanya jika nilainya valid, jika tidak biarkan null
          finalValue = !isNaN(parsedNumber) ? parsedNumber : null;
        }
      }

      setEditedData((prev) => ({ ...prev, [name]: finalValue }));

      // Hapus pesan error untuk field yang sedang diedit
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    }
  };

  const handleSaveWrapper = async () => {
    const hargaSewaString = String(editedData.hargasewa || "");
    const dataToValidate = {
      namaUlok: editedData.namaUlok,
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
      lebar_depan: editedData.lebardepan,
      panjang: editedData.panjang,
      luas: editedData.luas,
      harga_sewa: hargaSewaString.replace(/[^0-9]/g, ""),
      nama_pemilik: editedData.namapemilik,
      kontak_pemilik: editedData.kontakpemilik,
    };

    const validationResult = UlokUpdateSchema.safeParse(dataToValidate);

    if (!validationResult.success) {
      const formattedErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const key = String(issue.path[0]);
        formattedErrors[key] = issue.message;
      }
      setErrors(formattedErrors);
      console.error("Validation Errors:", formattedErrors);
      return;
    }
    const success = await onSave(validationResult.data);

    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedData(initialData);
    setErrors({});
    setIsEditing(false);
  };

  // Kembalikan semua state dan handler yang dibutuhkan oleh UI
  return {
    isEditing,
    setIsEditing,
    editedData,
    errors,
    handleInputChange,
    handleSaveWrapper,
    handleCancel,
  };
}
