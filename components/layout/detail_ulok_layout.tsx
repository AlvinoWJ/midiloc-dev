"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Dialog } from "@headlessui/react";
import {
  MapPin,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Edit3,
  Store,
  UserSquare,
  LinkIcon,
  Paperclip,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/statusbadge";
import CustomSelect from "@/components/ui/customselect";
import { ApprovalStatusbutton } from "@/components/ui/approvalbutton";
import DetailMapCard from "@/components/map/DetailMapCard";
import WilayahSelector from "@/components/ui/customselectwilayah";
import { DetailUlokSkeleton } from "../ui/skleton";
import { useUser } from "@/hooks/useUser";
import { useDetailUlokForm } from "@/hooks/ulok/useDetailUlokForm";
import { MappedUlokData } from "@/hooks/ulok/useUlokDetail";
import { UlokUpdateInput } from "@/lib/validations/ulok";
import { FileUpload } from "../ui/uploadfile";

const LocationPickerModal = dynamic(
  () => import("@/components/map/LocationPickerMap"),
  { ssr: false }
);

interface DetailUlokLayoutProps {
  isLoading?: boolean;
  initialData: MappedUlokData;
  onSave: (data: UlokUpdateInput | FormData) => Promise<boolean>;
  isSubmitting: boolean;
  onApprove: (status: "OK" | "NOK") => void;
  formulokUrl: string | null;
}

const DetailField = ({
  label,
  value,
  type = "text",
  isEditing,
  name,
  onChange,
}: any) => (
  <div>
    <label className="block font-semibold text-base lg:text-lg mb-2">
      {label}
      <span className="text-red-500">*</span>
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
      <div className="text-gray-900 py-2 text-base text-black font-medium bg-gray-100 rounded-lg px-3 min-h-[40px] flex items-start w-full break-words">
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
    onApprove,
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
            className="rounded-full flex-1 lg:w-32 lg:flex-none"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            variant="submit"
            size="default"
            className="rounded-full flex-1 lg:w-32 lg:flex-none"
            onClick={handleSaveWrapper}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              </>
            ) : (
              "Simpan"
            )}
            {/* {isSubmitting ? "Menyimpan..." : "Simpan"} */}
          </Button>
        </>
      ) : (
        isLocationSpecialist &&
        isPendingApproval && (
          <Button
            variant="default"
            size="default"
            className="rounded-full w-full lg:w-32"
            onClick={() => setIsEditing(true)}
            // Nonaktifkan tombol Edit jika LM sedang dalam proses approval
            disabled={isApproving}
          >
            <Edit3 size={16} className="mr-2" />
            Edit
          </Button>
        )
      )}
    </>
  );

  return (
    <>
      <main className="space-y-4 lg:space-y-6 pb-16 lg:pb-2">
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
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
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

              {/* Info Dibuat */}
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={14} className="mr-2 flex-shrink-0" />
                  <span>Dibuat Pada </span>
                  <span className="ml-1 font-medium">
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

                <div className="flex items-center text-sm text-gray-600">
                  <User size={14} className="mr-2 flex-shrink-0" />
                  <span>Dibuat oleh </span>
                  <span className="ml-1 font-medium">
                    {initialData.namaUser}
                  </span>
                </div>

                {initialData.updated_at && initialData.updated_by && (
                  <div className="flex items-center text-sm text-amber-700 bg-amber-50 -mx-2 px-2 py-2 rounded-lg mt-3 max-w-fit">
                    <Edit3 size={14} className="mr-2 flex-shrink-0" />
                    <div className="flex flex-wrap items-center gap-x-1">
                      <span>Terakhir diedit pada</span>
                      <span className="font-semibold">
                        {new Date(initialData.updated_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                      <span>oleh</span>
                      <span className="font-semibold">
                        {initialData.updated_by.nama}
                      </span>
                    </div>
                  </div>
                )}

                {initialData.approved_at &&
                  initialData.approved_by &&
                  (() => {
                    const isApproved = initialData.approval_status === "OK";

                    const statusText = isApproved
                      ? "Disetujui pada"
                      : "Ditolak pada";
                    const styleClasses = isApproved
                      ? "text-green-700 bg-green-50"
                      : "text-red-700 bg-red-50";
                    const IconComponent = isApproved ? CheckCircle2 : XCircle;

                    return (
                      <div
                        className={`flex items-start text-sm ${styleClasses} -mx-2 px-2 py-2 rounded-lg mt-2 max-w-fit`}
                      >
                        <IconComponent
                          size={14}
                          className="mr-2 mt-0.5 flex-shrink-0"
                        />
                        <div className="flex flex-wrap items-center gap-x-1">
                          <span>{statusText}</span>
                          <span className="font-semibold">
                            {new Date(
                              initialData.approved_at
                            ).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>oleh</span>
                          <span className="font-semibold">
                            {initialData.approved_by.nama}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            </div>
            <div className="flex-shrink-0  ">
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
                    <DetailField label="Alamat" value={editedData?.alamat} />
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

            {/* --- TOMBOL AKSI MANAGER --- */}
            {isLocationManager && isPendingApproval && (
              <div className="mt-6">
                <ApprovalStatusbutton
                  currentStatus={initialData.approval_status}
                  show={true}
                  fileUploaded={true}
                  onApprove={handleApproveAction}
                  loading={isApproving}
                  disabled={isApproving}
                />
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
