// hooks/useDetailUlokForm.ts

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

    if (name === "hargasewa") {
      const cleanValue = value.replace(/[^0-9]/g, ""); 
      setEditedData((prev) => ({ ...prev, [name]: cleanValue }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
      return;
    }

    if (name === "latlong") {
      const coords = value.split(",").map((coord) => coord.trim());
      const latStr = coords[0] || "";
      const longStr = coords[1] || "";

      const latitude = parseFloat(latStr);
      const longitude = parseFloat(longStr);

      setEditedData((prev) => ({
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
    } else {
      let finalValue: string | number | null = value;
      if (type === "number") {
        if (value === "") {
          finalValue = null;
        } else {
          const parsedNumber = parseFloat(value);
          finalValue = !isNaN(parsedNumber) ? parsedNumber : null;
        }
      }
      setEditedData((prev) => ({ ...prev, [name]: finalValue }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setEditedData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSaveWrapper = async () => {
    const cleanedHargaSewa = editedData.hargasewa
      ? parseInt(editedData.hargasewa.toString().replace(/[^0-9]/g, ""), 10)
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
      alas_hak: editedData.alasHak === 'true',
      jumlah_lantai: editedData.jumlahlantai,
      lebar_depan: editedData.lebardepan,
      panjang: editedData.panjang,
      luas: editedData.luas,
      harga_sewa: cleanedHargaSewa,
      nama_pemilik: editedData.namapemilik,
      kontak_pemilik: editedData.kontakpemilik,
    };

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

  return {
    isEditing,
    setIsEditing,
    editedData,
    errors,
    handleInputChange,
    handleSelectChange,
    handleSaveWrapper,
    handleCancel,
  };
}