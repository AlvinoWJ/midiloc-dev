"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Dialog } from "@headlessui/react";
import {
  MapPin,
  CheckCircle2,
  ArrowLeft,
  Edit3,
  Store,
  UserSquare,
  LinkIcon,
  Paperclip,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/statusbadge";
import CustomSelect from "@/components/ui/customselect";
import { ApprovalStatusbutton } from "@/components/ui/approvalbutton";
import DetailMapCard from "@/components/map/DetailMapCard";
import WilayahSelector from "@/components/ui/customselectwilayah";
import { DetailUlokSkeleton } from "./ui/skleton";
import { useUser } from "@/hooks/useUser";
import { useDetailUlokForm } from "@/hooks/useDetailUlokForm";
import { MappedUlokData } from "@/hooks/useUlokDetail";
import { UlokUpdateInput } from "@/lib/validations/ulok";
import { FileUpload } from "./ui/uploadfile";

// Dynamic import untuk komponen peta
const LocationPickerModal = dynamic(
  () => import("@/components/map/LocationPickerMap"),
  { ssr: false }
);

interface DetailUlokLayoutProps {
  isLoading?: boolean;
  initialData: MappedUlokData;
  onSave: (data: UlokUpdateInput | FormData) => Promise<boolean>;
  isSubmitting: boolean;
  onOpenIntipForm: () => void;
  onApprove: (status: "OK" | "NOK") => void;
  fileIntipUrl: string | null;
  formulokUrl: string | null;
}

// Komponen helper untuk field, tidak ada perubahan
const DetailField = ({
  label,
  value,
  type = "text",
  isEditing,
  name,
  onChange,
}: any) => (
  <div>
    <label className="block font-bold mb-1">
      {label}
      <span className="text-red-500">*</span>
    </label>
    {isEditing ? (
      type === "textarea" ? (
        <Textarea
          name={name}
          value={value}
          onChange={onChange}
          className="w-full text-sm"
          rows={3}
        />
      ) : (
        <Input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className="w-full text-sm"
        />
      )
    ) : (
      <div className="text-gray-900 py-2 text-sm bg-gray-100 rounded-lg px-3 min-h-[40px] flex items-start w-full break-words">
        {value || "-"}
      </div>
    )}
  </div>
);

// PERUBAHAN 1: Mengganti nama komponen menjadi lebih umum
export default function DetailUlokLayout(props: DetailUlokLayoutProps) {
  const {
    isLoading,
    initialData,
    onSave,
    isSubmitting,
    onOpenIntipForm,
    onApprove,
    fileIntipUrl,
    formulokUrl,
  } = props;

  const router = useRouter();
  const { user } = useUser();
  const [isApproving, setIsApproving] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const {
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
  } = useDetailUlokForm(initialData, onSave);

  if (isLoading) {
    return <DetailUlokSkeleton />;
  }

  const isLocationManager =
    user?.position_nama?.toLowerCase().trim() === "location manager";
  const isLocationSpecialist =
    user?.position_nama?.toLowerCase().trim() === "location specialist";
  const isIntipDone = !!initialData.file_intip;
  const isPendingApproval = initialData.approval_status === "In Progress";

  const formatStoreOptions = ["Reguler", "Super", "Spesifik", "Franchise"];
  const bentukObjekOptions = ["Tanah", "Bangunan"];

  const handleApproveAction = async (status: "OK" | "NOK") => {
    if (!onApprove) return;
    setIsApproving(true);
    await onApprove(status);
    setIsApproving(false);
  };

  const handleMapSelect = (lat: number, lng: number) => {
    const latlongValue = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const event = {
      target: { name: "latlong", value: latlongValue, type: "text" },
    } as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(event);
    setIsMapOpen(false);
  };

  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const atBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 5;
      setIsAtBottom(atBottom);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const ActionButtons = () => (
    <>
      {isEditing ? (
        <>
          <Button
            variant="back"
            size="default"
            className="rounded-full flex-1" // Dibuat flex-1 agar memenuhi ruang
            onClick={handleCancel}
          >
            Batal
          </Button>
          <Button
            variant="submit"
            size="default"
            className="rounded-full flex-1" // Dibuat flex-1 agar memenuhi ruang
            onClick={handleSaveWrapper}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </>
      ) : (
        <Button
          variant="default"
          size="default"
          className="rounded-full w-full" // Dibuat full width untuk mode view
          onClick={() => setIsEditing(true)}
        >
          <Edit3 size={16} className="mr-2" />
          Edit
        </Button>
      )}
    </>
  );

  return (
    <>
      {/* PERUBAHAN 2: Menambahkan padding yang lebih adaptif */}
      <main className="space-y-4 lg:space-y-6 pb-2 lg:pb-6">
        {/* --- HEADER TOMBOL --- */}
        <div className="flex justify-between items-center mb-6">
          <Button onClick={() => router.back()} variant="back">
            <ArrowLeft size={20} className="mr-1" />
            Kembali
          </Button>

          {isLocationSpecialist && isPendingApproval && (
            <div className="hidden lg:flex items-center gap-2">
              <ActionButtons />
            </div>
          )}
        </div>

        {/* --- KARTU JUDUL --- */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1 pr-4 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 truncate">
                {isEditing ? (
                  <Input
                    name="namaUlok"
                    value={editedData?.namaUlok || ""}
                    onChange={handleInputChange}
                    className="text-2xl font-bold"
                    placeholder="Masukkan Nama ULOK"
                  />
                ) : (
                  editedData?.namaUlok || "-"
                )}
              </h1>
              <div className="flex items-center text-sm text-gray-500 mb-1">
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
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                <span>Dibuat oleh {initialData.namaUser}</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <StatusBadge status={initialData.approval_status} />
            </div>
          </div>
        </div>

        {/* --- PETA LOKASI (Hanya di mode read) --- */}
        {!isEditing && (
          <div>
            <DetailMapCard
              id={initialData.id}
              latitude={
                initialData.latitude !== null &&
                initialData.latitude !== undefined
                  ? String(initialData.latitude)
                  : null
              }
              longitude={
                initialData.longitude !== null &&
                initialData.longitude !== undefined
                  ? String(initialData.longitude)
                  : null
              }
              approval_status={initialData.approval_status}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center">
                  <MapPin className="text-red-500 mr-3" size={20} />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Detail Lokasi
                  </h2>
                </div>
              </div>
              <div className="p-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <WilayahSelector
                      onWilayahChange={handleSelectChange}
                      errors={errors}
                      initialProvince={editedData?.provinsi}
                      initialRegency={editedData?.kabupaten}
                      initialDistrict={editedData?.kecamatan}
                      initialVillage={editedData?.kelurahan}
                    />
                    <DetailField
                      label="Alamat"
                      value={editedData.alamat}
                      isEditing={true}
                      type="textarea"
                      name="alamat"
                      onChange={handleInputChange}
                    />
                    <div>
                      <label className="block font-bold mb-1">
                        LatLong<span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          name="latlong"
                          value={`${editedData.latitude ?? ""}, ${
                            editedData.longitude ?? ""
                          }`}
                          onChange={handleInputChange}
                          className="w-full text-sm"
                          placeholder="Contoh: -6.123, 106.123"
                        />
                        <Button
                          type="button"
                          onClick={() => setIsMapOpen(true)}
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <DetailField
                      label="Provinsi"
                      value={editedData?.provinsi}
                    />
                    <DetailField
                      label="Kabupaten/Kota"
                      value={editedData?.kabupaten}
                    />
                    <DetailField
                      label="Kecamatan"
                      value={editedData?.kecamatan}
                    />
                    <DetailField
                      label="Kelurahan/Desa"
                      value={editedData?.kelurahan}
                    />
                    <div className="md:col-span-2">
                      <DetailField label="Alamat" value={editedData?.alamat} />
                    </div>
                    <DetailField
                      label="LatLong"
                      value={`${editedData.latitude ?? ""}, ${
                        editedData.longitude ?? ""
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* --- KARTU DATA STORE --- */}
            <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center">
                  <Store className="text-red-500 mr-3" size={20} />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Detail Store
                  </h2>
                </div>
              </div>
              <div className="p-6">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomSelect
                      id="formatStore"
                      name="formatStore"
                      label="Format Store"
                      placeholder="Pilih Format Store"
                      value={editedData.formatStore}
                      options={formatStoreOptions}
                      onChange={(e) =>
                        handleSelectChange("formatStore", e.target.value)
                      }
                      error={errors.formatStore}
                    />
                    <CustomSelect
                      id="bentukObjek"
                      name="bentukObjek"
                      label="Bentuk Objek"
                      placeholder="Pilih Bentuk Objek"
                      value={editedData.bentukObjek}
                      options={bentukObjekOptions}
                      onChange={(e) =>
                        handleSelectChange("bentukObjek", e.target.value)
                      }
                      error={errors.bentukObjek}
                    />
                    <DetailField
                      label="Alas Hak"
                      value={editedData.alasHak}
                      isEditing={true}
                      name="alasHak"
                      onChange={handleInputChange}
                    />
                    <DetailField
                      label="Jumlah Lantai"
                      value={editedData.jumlahlantai}
                      isEditing={true}
                      name="jumlahlantai"
                      type="number"
                      onChange={handleInputChange}
                    />
                    <DetailField
                      label="Lebar Depan (m)"
                      value={editedData.lebardepan}
                      isEditing={true}
                      name="lebardepan"
                      type="text"
                      onChange={handleInputChange}
                    />
                    <DetailField
                      label="Panjang (m)"
                      value={editedData.panjang}
                      isEditing={true}
                      name="panjang"
                      type="text"
                      onChange={handleInputChange}
                    />
                    <DetailField
                      label="Luas (m²)"
                      value={editedData.luas}
                      isEditing={true}
                      name="luas"
                      type="text"
                      onChange={handleInputChange}
                    />
                    <DetailField
                      label="Harga Sewa (+PPH 10%)"
                      value={editedData.hargasewa}
                      isEditing={true}
                      name="hargasewa"
                      onChange={handleInputChange}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <DetailField
                      label="Format Store"
                      value={editedData?.formatStore}
                    />
                    <DetailField
                      label="Bentuk Objek"
                      value={editedData?.bentukObjek}
                    />
                    <DetailField label="Alas Hak" value={editedData?.alasHak} />
                    <DetailField
                      label="Jumlah Lantai"
                      value={editedData?.jumlahlantai}
                    />
                    <DetailField
                      label="Lebar Depan (m)"
                      value={editedData?.lebardepan}
                    />
                    <DetailField
                      label="Panjang (m)"
                      value={editedData?.panjang}
                    />
                    <DetailField label="Luas (m²)" value={editedData?.luas} />
                    <DetailField
                      label="Harga Sewa (+PPH 10%)"
                      value={editedData?.hargasewa}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* --- KARTU DATA PEMILIK --- */}
            <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center">
                  <UserSquare className="text-red-500 mr-3" size={20} />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Data Pemilik
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <DetailField
                    label="Nama Pemilik"
                    value={editedData.namapemilik}
                    isEditing={isEditing}
                    name="namapemilik"
                    onChange={handleInputChange}
                  />
                  <DetailField
                    label="Kontak Pemilik"
                    value={editedData.kontakpemilik}
                    isEditing={isEditing}
                    name="kontakpemilik"
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* --- Form Ulok --- */}
            <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center">
                  <Paperclip className="text-red-500 mr-3" size={20} />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Form Ulok
                  </h2>
                </div>
              </div>
              <div className="p-6">
                {isEditing && isLocationSpecialist ? (
                  <div className="space-y-4">
                    {formulokUrl && !newFormUlokFile && (
                      <div>
                        <label className="block font-bold mb-1">
                          File Saat Ini
                        </label>
                        <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg border">
                          <div className="flex items-center min-w-0">
                            <FileText className="w-5 h-5 mr-3 text-gray-500 flex-shrink-0" />
                            <span className="text-sm text-gray-800 font-medium truncate">
                              {initialData.formulok?.split("/").pop() ||
                                "form_ulok.pdf"}
                            </span>
                          </div>
                          <a
                            href={formulokUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg"
                          >
                            <LinkIcon className="w-3 h-3 mr-1.5" />
                            Lihat
                          </a>
                        </div>
                      </div>
                    )}
                    <FileUpload
                      label={
                        formulokUrl
                          ? "Ganti File (PDF, max 15MB)"
                          : "Upload File (PDF, max 15MB)"
                      }
                      name="form_ulok_upload"
                      value={newFormUlokFile}
                      onChange={handleFileChange}
                      accept="application/pdf"
                      maxSizeMB={15}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                    <span className="text-sm text-gray-800 font-medium">
                      Formulir Usulan Lokasi
                    </span>
                    {formulokUrl ? (
                      <a
                        href={formulokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg"
                      >
                        <LinkIcon className="w-3 h-3 mr-1.5" />
                        Lihat
                      </a>
                    ) : (
                      <span className="text-xs text-gray-500">
                        File tidak tersedia
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* --- KARTU INTIP (Hanya di mode read) --- */}
            {!isEditing && isIntipDone && (
              <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center">
                    <CheckCircle2 className="text-green-600 mr-3" size={20} />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Data Approval INTIP
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-y-4">
                    <DetailField
                      label="Status INTIP"
                      value={initialData.approval_intip || "-"}
                    />
                    <DetailField
                      label="Tanggal Approval"
                      value={
                        initialData.tanggal_approval_intip
                          ? new Date(
                              initialData.tanggal_approval_intip
                            ).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "-"
                      }
                    />
                    {fileIntipUrl && (
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border mt-2">
                        <span className="text-sm text-gray-800 font-medium">
                          File Intip
                        </span>
                        <a
                          href={fileIntipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg"
                        >
                          <LinkIcon className="w-3 h-3 mr-1.5" />
                          Lihat
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --- TOMBOL AKSI MANAGER --- */}
            {isLocationManager && isPendingApproval && !isEditing && (
              <div className="mt-6">
                {!isIntipDone ? (
                  <Button
                    onClick={onOpenIntipForm}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-full"
                  >
                    Input Data Intip
                  </Button>
                ) : (
                  <ApprovalStatusbutton
                    currentStatus={initialData.approval_status}
                    show={true}
                    fileUploaded={true}
                    onApprove={handleApproveAction}
                    loading={isApproving}
                    disabled={isApproving}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {isLocationSpecialist && isPendingApproval && (
        <div
          className={` lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 transition-all duration-300 ease-in-out
                        ${
                          isAtBottom
                            ? "bg-transparent shadow-none border-transparent"
                            : "bg-background border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]"
                        }
                    `}
        >
          <div className="flex items-center gap-3">
            <ActionButtons />
          </div>
        </div>
      )}

      {/* --- MODAL PETA --- */}
      <Dialog
        open={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-4xl h-[85vh] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                Pilih Lokasi dari Peta
              </Dialog.Title>
              <p className="text-sm text-gray-500">
                Klik pada peta untuk memilih koordinat, lalu tekan konfirmasi.
              </p>
            </div>
            <div className="flex-grow">
              {isMapOpen && <LocationPickerModal onConfirm={handleMapSelect} />}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
