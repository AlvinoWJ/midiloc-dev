// hooks/useDetailUlokForm.tsx
import { useState, useEffect } from "react";
import { MappedUlokData } from "@/hooks/ulok/useUlokDetail";
import { UlokUpdateSchema, UlokUpdateInput } from "@/lib/validations/ulok";

type SaveData = UlokUpdateInput | FormData;

const convertkoma = (val: any) => {
  if (val === null || val === undefined || val === "") return "";
  const s = String(val);
  return s.replace(".", ",");
};

const parseKomaToNumber = (val: any) => {
  if (val === null || val === undefined || val === "") return 0;
  const s = String(val).replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return isNaN(n) ? 0 : n;
};

export function useDetailUlokForm(
  initialData: MappedUlokData | null | undefined,
  onSave: (data: SaveData) => Promise<boolean>
) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(initialData || {});
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [newFormUlokFile, setNewFormUlokFile] = useState<File | null>(null);

  useEffect(() => {
    if (!initialData) {
      setEditedData(initialData || {});
      return;
    }

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

  const handleFileChange = (file: File | null) => {
    setNewFormUlokFile(file);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (["lebardepan", "panjang", "luas"].includes(name)) {
      let filtered = value.replace(/[^0-9.,]/g, "");
      filtered = filtered.replace(".", ",");
      const parts = filtered.split(",");
      if (parts.length > 2) filtered = parts[0] + "," + parts[1];
      setEditedData((prev: any) => ({ ...prev, [name]: filtered }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
      return;
    }

    if (name === "hargasewa") {
      const cleanValue = value.replace(/[^0-9]/g, "");
      setEditedData((prev: any) => ({ ...prev, [name]: cleanValue }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
      return;
    }

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

      if (errors.latitude || errors.longitude) {
        setErrors((prev) => ({
          ...prev,
          latitude: undefined,
          longitude: undefined,
        }));
      }
      return;
    }

    // --- Default handler (untuk field lain)
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

  const handleSelectChange = (name: string, value: string) => {
    setEditedData((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSaveWrapper = async () => {
    // 1. Persiapkan dan bersihkan data (sama seperti sebelumnya)
    const lebardepan = parseKomaToNumber(editedData.lebardepan);
    const panjang = parseKomaToNumber(editedData.panjang);
    const luas = parseKomaToNumber(editedData.luas);
    const cleanedHargaSewa = editedData.hargasewa
      ? parseInt(String(editedData.hargasewa).replace(/[^0-9]/g, ""), 10)
      : 0;

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
    }; // 2. Lakukan validasi di client (sama seperti sebelumnya)

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
    } // 3. Buat FormData //    Ini adalah perubahan utama: kita selalu membuat FormData

    const formData = new FormData(); // 4. Tambahkan file jika ada

    if (newFormUlokFile) {
      formData.append("form_ulok", newFormUlokFile);
    } // 5. Tambahkan SEMUA data yang sudah divalidasi ke FormData //    Kita gunakan 'validationResult.data' yang berisi data bersih //    formData.append akan mengubah tipe 'number' menjadi 'string' (misal: 10.5 -> "10.5") //    Ini sesuai dengan apa yang diharapkan oleh backend (multipart/form-data)

    for (const [key, value] of Object.entries(validationResult.data)) {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    } // 6. Kirim FormData

    const success = await onSave(formData);
    if (success) {
      setIsEditing(false);
      setNewFormUlokFile(null); // Reset file setelah sukses
    }
  };

  const handleCancel = () => {
    // kembalikan editedData ke initialData (dengan konversi titik->koma jika ada)
    if (!initialData) {
      setEditedData({});
    } else {
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
