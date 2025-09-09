"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { UlokUpdateSchema, UlokUpdateInput } from "@/lib/validations/ulok"; // <-- Impor tipe Zod
import { MapPin } from "lucide-react";

interface UlokData {
  id: string;
  namaUlok: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  kelurahan: string;
  alamat: string;
  latlong: string;
  tanggalUlok: string;
  formatStore: string;
  bentukObjek: string;
  alasHak: string;
  jumlahlantai: string;
  lebardepan: string;
  panjang: string;
  luas: string;
  hargasewa: string;
  namapemilik: string;
  kontakpemilik: string;
  approval_status: string; // <-- Tambahkan field status untuk logika tombol
  file_intip: string | null; // <-- Tambahkan untuk logika tombol intip
}

interface DetailUlokProps {
  initialData: UlokData;
  onSave: (data: UlokUpdateInput) => Promise<boolean>;
  isSubmitting: boolean;
  onOpenIntipForm: () => void;
  onApprove?: (status: "OK" | "Rejected") => void;
  user?: CurrentUser | null; // ✅ ditambahkan
}

type CurrentUser = {
  id: string;
  nama: string;
  position_nama: string;
};

const DetailField = ({
  label,
  value,
  isEditing,
  name,
  onChange,
  type = "text",
}: any) => (
  <div className="mb-4">
    <label className="text-gray-600 font-medium text-sm mb-1 block">
      {label}
    </label>
    {isEditing ? (
      type === "textarea" ? (
        <Textarea
          name={name}
          value={value}
          onChange={onChange}
          className="w-full"
          rows={3}
        />
      ) : (
        <Input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className="w-full"
        />
      )
    ) : (
      <div className="text-gray-900 font-normal py-2">{value || "-"}</div>
    )}
  </div>
);

export default function DetailUlok({
  initialData,
  onSave,
  isSubmitting,
  onOpenIntipForm,
  onApprove,
  user,
}: DetailUlokProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    setEditedData(initialData);
  }, [initialData]);

  if (!user) {
    return <div>Loading user data...</div>; // Teks ini akan muncul sesaat
  }

  const canApprove = () =>
    user?.position_nama?.toLowerCase().trim() === "Location Manager";
  const isLocationManagerintip = () =>
    user?.position_nama?.toLowerCase().trim() === "location manager";
  const isLocationSpecialist = () =>
    user?.position_nama?.toLowerCase().trim() === "location specialist";

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSaveWrapper = async () => {
    const dataToValidate = {
      nama_ulok: editedData.namaUlok,
      desa_kelurahan: editedData.kelurahan,
      kecamatan: editedData.kecamatan,
      kabupaten: editedData.kabupaten,
      provinsi: editedData.provinsi,
      alamat: editedData.alamat,
      format_store: editedData.formatStore,
      bentuk_objek: editedData.bentukObjek,
      alas_hak: editedData.alasHak,
      jumlah_lantai: editedData.jumlahlantai,
      lebar_depan: editedData.lebardepan,
      panjang: editedData.panjang,
      luas: editedData.luas,
      harga_sewa: editedData.hargasewa.replace(/[^0-9]/g, ""),
      nama_pemilik: editedData.namapemilik,
      kontak_pemilik: editedData.kontakpemilik,
    };

    const validationResult = UlokUpdateSchema.safeParse(dataToValidate);

    if (!validationResult.success) {
      // Jika validasi gagal, format dan simpan pesan error
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

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-2">
        <div className="flex justify-between items-center mb-6">
          <Button
            onClick={() => router.back()}
            className="rounded-full w-20 h-10"
          >
            Back
          </Button>
          <div className="flex gap-3">
            {isLocationSpecialist() && (
              <>
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="rounded-full px-6"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveWrapper}
                      className="bg-submit hover:bg-green-600 text-white rounded-full px-6"
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 py-2 font-medium"
                  >
                    Edit
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        {/* Title Card */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1 pr-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isEditing ? (
                  <Input
                    name="namaUlok"
                    value={editedData?.namaUlok || ""}
                    onChange={handleInputChange}
                    className="text-2xl font-bold border-2 border-gray-300 rounded px-3 py-2 focus:ring-0 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                  />
                ) : (
                  editedData?.namaUlok || "-"
                )}
              </h1>
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                <span>Dibuat Pada </span>
                <span className="ml-1">
                  {new Date(editedData?.tanggalUlok || "").toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </span>
              </div>
            </div>

            {/* Status badge dengan flex-shrink-0 agar tidak mengecil */}
            <div className="flex-shrink-0">
              <div className="bg-progress text-white px-4 py-2 rounded text-sm font-medium whitespace-nowrap">
                In Progress
              </div>
            </div>
          </div>
        </div>
        {/* Data Usulan Lokasi Card */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <MapPin className="text-red-500 mr-3" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">
                Data Usulan Lokasi
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <DetailField
                label="Provinsi"
                value={editedData?.provinsi || ""}
                isEditing={isEditing}
                name="provinsi"
                onChange={handleInputChange}
              />
              <DetailField
                label="Kabupaten/Kota"
                value={editedData?.kabupaten || ""}
                isEditing={isEditing}
                name="kabupaten"
                onChange={handleInputChange}
              />
              <DetailField
                label="Kecamatan"
                value={editedData?.kecamatan || ""}
                isEditing={isEditing}
                name="kecamatan"
                onChange={handleInputChange}
              />
              <DetailField
                label="Kelurahan/Desa"
                value={editedData?.kelurahan || ""}
                isEditing={isEditing}
                name="kelurahan"
                onChange={handleInputChange}
              />
            </div>
            <div className="mt-4">
              <DetailField
                label="Alamat"
                value={editedData?.alamat || ""}
                isEditing={isEditing}
                inputValue={editedData?.alamat || ""}
                inputType="textarea"
                name="alamat"
                onChange={handleInputChange}
              />
            </div>
            <div className="mt-4">
              <DetailField
                label="LatLong"
                value={editedData?.latlong || ""}
                isEditing={isEditing}
                inputValue={editedData?.latlong || ""}
                name="latlong"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
        {/* Data Store Card */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <img
                src="/icons/store.png"
                alt="Logo Data Store"
                className="w-6 h-6 mr-3 object-contain"
              />
              <h2 className="text-lg font-semibold text-gray-900">
                Data Store
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <DetailField
                label="Format Store"
                value={editedData?.formatStore || ""}
                isEditing={isEditing}
                inputValue={editedData?.formatStore || ""}
                name="formatStore"
                onChange={handleInputChange}
              />
              <DetailField
                label="Bentuk Objek"
                value={editedData?.bentukObjek || ""}
                isEditing={isEditing}
                inputValue={editedData?.bentukObjek || ""}
                name="bentukObjek"
                onChange={handleInputChange}
              />
              <DetailField
                label="Alas Hak"
                value={editedData?.alasHak || ""}
                isEditing={isEditing}
                inputValue={editedData?.alasHak || ""}
                name="alasHak"
                onChange={handleInputChange}
              />
              <DetailField
                label="Jumlah Lantai"
                value={editedData?.jumlahlantai || ""}
                isEditing={isEditing}
                inputValue={editedData?.jumlahlantai || ""}
                inputType="number"
                name="jumlahlantai"
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mt-4">
              <DetailField
                label="Lebar Depan"
                value={`${editedData?.lebardepan || ""} m`}
                isEditing={isEditing}
                inputValue={editedData?.lebardepan || ""}
                inputType="number"
                name="lebardepan"
                onChange={handleInputChange}
              />
              <DetailField
                label="Panjang"
                value={`${editedData?.panjang || ""} m`}
                isEditing={isEditing}
                inputValue={editedData?.panjang || ""}
                inputType="number"
                name="panjang"
                onChange={handleInputChange}
              />
              <DetailField
                label="Luas"
                value={`${editedData?.luas || ""} m2`}
                isEditing={isEditing}
                inputValue={editedData?.luas || ""}
                inputType="number"
                name="luas"
                onChange={handleInputChange}
              />
            </div>
            <div className="mt-4">
              <DetailField
                label="Harga Sewa (+PPH 10%)"
                value={editedData?.hargasewa || ""}
                isEditing={isEditing}
                inputValue={editedData?.hargasewa || ""}
                name="hargasewa"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
        {/* Data Pemilik Card */}
        <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <img
                src="/icons/profil2.png"
                alt="Logo Data Store"
                className="w-6 h-6 mr-3 object-contain"
              />
              <h2 className="text-lg font-semibold text-gray-900">
                Data Pemilik
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <DetailField
                label="Nama Pemilik"
                value={editedData?.namapemilik || ""}
                isEditing={isEditing}
                inputValue={editedData?.namapemilik || ""}
                name="namapemilik"
                onChange={handleInputChange}
              />
              <DetailField
                label="Kontak Pemilik"
                value={editedData?.kontakpemilik || ""}
                isEditing={isEditing}
                inputValue={editedData?.kontakpemilik || ""}
                name="kontakpemilik"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {isLocationManagerintip() && !initialData.file_intip && (
          <button
            onClick={onOpenIntipForm} // ✅ panggil props, bukan langsung state
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors duration-200"
            disabled={isSubmitting}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Input Data Intip
          </button>
        )}
        {/* ✅ Tombol Approve/Tolak */}
        {canApprove() && initialData.file_intip && (
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => onApprove && onApprove("OK")}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              disabled={isSubmitting}
            >
              Setujui
            </Button>
            <Button
              onClick={() => onApprove && onApprove("Rejected")}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              disabled={isSubmitting}
            >
              Tolak
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
