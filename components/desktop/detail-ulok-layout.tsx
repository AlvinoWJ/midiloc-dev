"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Dialog } from "@headlessui/react";
import {
  MapPin,
  CheckCircle2,
  FileText,
  ArrowLeft,
  Edit3,
  Store,
  UserSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/statusbadge";
import CustomSelect from "@/components/ui/customselect";
import { ApprovalStatusbutton } from "@/components/ui/approvalbutton";
import DetailMapCard from "@/components/ui/DetailMapCard";
import Sidebar from "@/components/desktop/sidebar";
import Navbar from "@/components/desktop/navbar";
import WilayahSelector from "@/components/desktop/wilayahselector";
import { DetailUlokSkeleton } from "./skleton";
import { useUser } from "@/hooks/useUser";
import { useSidebar } from "@/hooks/useSidebar";
import { useDetailUlokForm } from "@/hooks/useDetailUlokForm";
import { MappedUlokData } from "@/hooks/useUlokDetail";
import { UlokUpdateInput } from "@/lib/validations/ulok";

// Dynamic import untuk komponen peta
const LocationPickerModal = dynamic(
  () => import("@/components/map/LocationPickerMap"),
  { ssr: false }
);

interface DetailUlokLayoutProps {
  isLoading?: boolean;
  initialData: MappedUlokData;
  onSave: (data: UlokUpdateInput) => Promise<boolean>;
  isSubmitting: boolean;
  onOpenIntipForm: () => void;
  onApprove: (status: "OK" | "NOK") => void;
  fileIntipUrl: string | null;
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
    <label className="text-gray-600 font-medium text-sm mb-1 block">
      {label}
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

export default function DesktopDetailUlokLayout(props: DetailUlokLayoutProps) {
  const {
    isLoading,
    initialData,
    onSave,
    isSubmitting,
    onOpenIntipForm,
    onApprove,
    fileIntipUrl,
  } = props;

  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const { user } = useUser();
  const [isApproving, setIsApproving] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const {
    isEditing,
    setIsEditing,
    editedData,
    errors,
    handleInputChange,
    handleSelectChange,
    handleSaveWrapper,
    handleCancel,
  } = useDetailUlokForm(initialData, onSave);

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <div
          className={`flex-1 flex flex-col bg-gray-50 min-h-screen transition-all duration-300 ${
            isCollapsed ? "ml-[80px]" : "ml-[270px]"
          }`}
        >
          <Navbar />
          <main className="flex-1 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <DetailUlokSkeleton />
            </div>
          </main>
        </div>
      </div>
    );
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

  return (
    <>
      <div className="flex">
        <Sidebar />
        <div
          className={`flex-1 flex flex-col bg-gray-50 min-h-screen transition-all duration-300 ${
            isCollapsed ? "ml-[80px]" : "ml-[270px]"
          }`}
        >
          <Navbar />
          <main className="flex-1 p-4 md:p-6 hide-scrollbar">
            <div className="max-w-7xl mx-auto">
              {/* --- HEADER TOMBOL --- */}
              <div className="flex justify-between items-center mb-6">
                <Button onClick={() => router.back()} variant="back">
                  <ArrowLeft size={20} className="mr-1" />
                  Kembali
                </Button>

                {isLocationSpecialist && isPendingApproval && (
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          variant="back"
                          size="default"
                          className="rounded-full"
                          onClick={handleCancel}
                        >
                          Batal
                        </Button>
                        <Button
                          variant="submit"
                          size="default"
                          className="rounded-full"
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
                        className="rounded-full"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit3 size={16} className="mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* --- KARTU JUDUL --- */}
              <div className="bg-white rounded-xl p-6 mb-8 shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
                <div className="flex items-start justify-between">
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
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                      <span>Dibuat Pada </span>
                      <span className="ml-1">
                        {new Date(
                          editedData?.tanggalUlok || ""
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                      <span>Dibuat oleh {initialData.namaUser}</span>
                      <span className="ml-1"></span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={initialData.approval_status} />
                  </div>
                </div>
              </div>

              {/* --- KARTU DATA USULAN LOKASI --- */}
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
                        <label className="text-gray-600 font-medium text-sm mb-1 block">
                          LatLong
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
                        <DetailField
                          label="Alamat"
                          value={editedData?.alamat}
                        />
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
              <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center">
                    <Store className="text-red-500 mr-3" size={20} />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Data Store
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  {isEditing ? (
                    <div className="space-y-4">
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
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <DetailField
                          label="Lebar Depan (m)"
                          value={editedData.lebardepan}
                          isEditing={true}
                          name="lebardepan"
                          type="number"
                          onChange={handleInputChange}
                        />
                        <DetailField
                          label="Panjang (m)"
                          value={editedData.panjang}
                          isEditing={true}
                          name="panjang"
                          type="number"
                          onChange={handleInputChange}
                        />
                        <DetailField
                          label="Luas (m²)"
                          value={editedData.luas}
                          isEditing={true}
                          name="luas"
                          type="number"
                          onChange={handleInputChange}
                        />
                      </div>
                      <DetailField
                        label="Harga Sewa (+PPH 10%)"
                        value={editedData.hargasewa}
                        isEditing={true}
                        name="hargasewa"
                        onChange={handleInputChange}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <DetailField
                          label="Format Store"
                          value={editedData?.formatStore}
                        />
                        <DetailField
                          label="Bentuk Objek"
                          value={editedData?.bentukObjek}
                        />
                        <DetailField
                          label="Alas Hak"
                          value={editedData?.alasHak}
                        />
                        <DetailField
                          label="Jumlah Lantai"
                          value={editedData?.jumlahlantai}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 mt-4">
                        <DetailField
                          label="Lebar Depan (m)"
                          value={editedData?.lebardepan}
                        />
                        <DetailField
                          label="Panjang (m)"
                          value={editedData?.panjang}
                        />
                        <DetailField
                          label="Luas (m²)"
                          value={editedData?.luas}
                        />
                      </div>
                      <div className="mt-4">
                        <DetailField
                          label="Harga Sewa (+PPH 10%)"
                          value={editedData?.hargasewa}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* --- KARTU DATA PEMILIK --- */}
              <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
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
                      value={
                        isEditing
                          ? editedData.namapemilik
                          : editedData?.namapemilik
                      }
                      isEditing={isEditing}
                      name="namapemilik"
                      onChange={handleInputChange}
                    />
                    <DetailField
                      label="Kontak Pemilik"
                      value={
                        isEditing
                          ? editedData.kontakpemilik
                          : editedData?.kontakpemilik
                      }
                      isEditing={isEditing}
                      name="kontakpemilik"
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* --- PETA & KARTU INTIP (Hanya di mode view) --- */}
              {!isEditing && (
                <>
                  <DetailMapCard id={initialData.id} />
                  {isIntipDone && (
                    <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] my-8">
                      <div className="border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center">
                          <CheckCircle2
                            className="text-green-600 mr-3"
                            size={20}
                          />
                          <h2 className="text-lg font-semibold text-gray-900">
                            Data Approval INTIP
                          </h2>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
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
                          <div className="md:col-span-2">
                            <label className="text-gray-600 font-medium text-sm mb-1 block">
                              Bukti Approval
                            </label>
                            {fileIntipUrl &&
                              (() => {
                                const isImage =
                                  /\.(jpeg|jpg|gif|png|webp)$/i.test(
                                    initialData.file_intip || ""
                                  );
                                return isImage ? (
                                  <a
                                    href={fileIntipUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img
                                      src={fileIntipUrl}
                                      alt="Preview"
                                      className="rounded-lg shadow-md max-w-xs max-h-60 object-contain border"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={fileIntipUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg text-sm text-red-600 hover:text-red-800 font-semibold max-w-md"
                                  >
                                    <FileText className="h-4 w-4" />
                                    <span>
                                      Lihat File: {initialData.file_intip}
                                    </span>
                                  </a>
                                );
                              })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* --- TOMBOL AKSI MANAGER --- */}
              {isLocationManager && isPendingApproval && !isEditing && (
                <div className="mt-8 flex justify-end">
                  {!isIntipDone ? (
                    <Button
                      onClick={onOpenIntipForm}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-3 text-base"
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
          </main>
        </div>
      </div>

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
