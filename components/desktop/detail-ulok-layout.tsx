"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { UlokUpdateInput } from "@/lib/validations/ulok";
import { MapPin, CheckCircle2, FileText, ArrowLeft, Edit3 } from "lucide-react";
import { StatusBadge } from "@/components/ui/statusbadge";
import { useUser } from "@/hooks/useUser";
import DetailMapCard from "@/components/ui/DetailMapCard";
import Sidebar from "@/components/desktop/sidebar";
import Navbar from "@/components/desktop/navbar";
import { useSidebar } from "@/hooks/useSidebar";
import { ApprovalStatusbutton } from "@/components/ui/approvalbutton";
import { useDetailUlokForm } from "@/hooks/useDetailUlokForm";
import { MappedUlokData } from "@/hooks/useUlokDetail";
import CustomSelect from "@/components/ui/customselect";
import WilayahSelector from "@/components/desktop/wilayahselector";
import { DetailUlokSkeleton } from "./skleton";

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
  isEditing,
  name,
  type = "text",
  onChange,
}: any) => (
  <div className="mb-4">
    <label className="text-gray-600 font-medium text-sm mb-2 block">
      {label}
    </label>
    {isEditing ? (
      type === "textarea" ? (
        <Textarea
          name={name}
          value={value}
          onChange={onChange}
          className="w-full text-sm"
          rows={2}
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
      <div className="text-gray-900 py-2 text-sm bg-gray-50 rounded-lg px-3 min-h-[40px] flex items-start w-full break-words">
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

  // Jika sedang loading, jangan proses logika di bawahnya
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
  const alasHakOptions = ["true", "false"];

  const handleApproveAction = async (status: "OK" | "NOK") => {
    if (!onApprove) return;
    setIsApproving(true);
    await onApprove(status);
    setIsApproving(false);
  };

  return (
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
            {/* --- BAGIAN TOMBOL ATAS --- */}
            <div className="flex justify-between items-center mb-6">
              <Button onClick={() => router.back()} variant="back">
                <ArrowLeft size={20} className="mr-1" />
                Kembali
              </Button>

              <div className="flex gap-3">
                {isLocationSpecialist && isPendingApproval && (
                  <>
                    {isEditing ? (
                      <>
                        <Button
                          variant="back"
                          onClick={handleCancel}
                          className="rounded-full px-6"
                        >
                          Batal
                        </Button>
                        <Button
                          variant="submit"
                          onClick={handleSaveWrapper}
                          disabled={isSubmitting}
                          className="px-6"
                        >
                          {isSubmitting ? "Menyimpan..." : "Simpan"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 py-2 font-medium flex items-center gap-2"
                      >
                        <Edit3 size={16} />
                        Edit
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
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
                      {new Date(
                        editedData?.tanggalUlok || ""
                      ).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <StatusBadge status={initialData.approval_status} />
                </div>
              </div>
            </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  {isEditing ? (
                    <div className="col-span-1 md:col-span-2">
                      <WilayahSelector
                        onWilayahChange={handleSelectChange}
                        errors={errors}
                        initialProvince={editedData?.provinsi}
                        initialRegency={editedData?.kabupaten}
                        initialDistrict={editedData?.kecamatan}
                        initialVillage={editedData?.kelurahan}
                      />
                    </div>
                  ) : (
                    <>
                      <DetailField
                        label="Provinsi"
                        value={editedData?.provinsi || ""}
                      />
                      <DetailField
                        label="Kabupaten/Kota"
                        value={editedData?.kabupaten || ""}
                      />
                      <DetailField
                        label="Kecamatan"
                        value={editedData?.kecamatan || ""}
                      />
                      <DetailField
                        label="Kelurahan/Desa"
                        value={editedData?.kelurahan || ""}
                      />
                    </>
                  )}
                </div>
                <DetailField
                  label="Alamat"
                  value={editedData?.alamat || ""}
                  isEditing={isEditing}
                  type="textarea"
                  name="alamat"
                  onChange={handleInputChange}
                />
                <DetailField
                  label="LatLong"
                  value={`${editedData?.latitude ?? ""}, ${
                    editedData?.longitude ?? ""
                  }`}
                  isEditing={isEditing}
                  name="latlong"
                  onChange={handleInputChange}
                />
              </div>
            </div>

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
                  {isEditing ? (
                    <CustomSelect
                      id="formatStore"
                      name="formatStore"
                      label="Format Store"
                      placeholder="Pilih Format Store"
                      value={editedData?.formatStore || ""}
                      options={formatStoreOptions}
                      onChange={(e) =>
                        handleSelectChange("formatStore", e.target.value)
                      }
                      error={errors.formatStore}
                    />
                  ) : (
                    <DetailField
                      label="Format Store"
                      value={editedData?.formatStore || ""}
                    />
                  )}
                  {isEditing ? (
                    <CustomSelect
                      id="bentukObjek"
                      name="bentukObjek"
                      label="Bentuk Objek"
                      placeholder="Pilih Bentuk Objek"
                      value={editedData?.bentukObjek || ""}
                      options={bentukObjekOptions}
                      onChange={(e) =>
                        handleSelectChange("bentukObjek", e.target.value)
                      }
                      error={errors.bentukObjek}
                    />
                  ) : (
                    <DetailField
                      label="Bentuk Objek"
                      value={editedData?.bentukObjek || ""}
                    />
                  )}
                  {isEditing ? (
                    <CustomSelect
                      id="alasHak"
                      name="alasHak"
                      label="Alas Hak"
                      placeholder="Pilih Alas Hak"
                      value={editedData?.alasHak || ""}
                      options={alasHakOptions}
                      onChange={(e) =>
                        handleSelectChange("alasHak", e.target.value)
                      }
                      error={errors.alasHak}
                    />
                  ) : (
                    <DetailField
                      label="Alas Hak"
                      value={editedData?.alasHak || ""}
                    />
                  )}
                  <DetailField
                    label="Jumlah Lantai"
                    value={editedData?.jumlahlantai || ""}
                    isEditing={isEditing}
                    type="number"
                    name="jumlahlantai"
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mt-4">
                  <DetailField
                    label="Lebar Depan"
                    value={editedData?.lebardepan || ""}
                    isEditing={isEditing}
                    type="number"
                    name="lebardepan"
                    onChange={handleInputChange}
                  />
                  <DetailField
                    label="Panjang"
                    value={editedData?.panjang || ""}
                    isEditing={isEditing}
                    type="number"
                    name="panjang"
                    onChange={handleInputChange}
                  />
                  <DetailField
                    label="Luas"
                    value={editedData?.luas || ""}
                    isEditing={isEditing}
                    type="number"
                    name="luas"
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mt-4">
                  <DetailField
                    label="Harga Sewa (+PPH 10%)"
                    value={editedData?.hargasewa || ""}
                    isEditing={isEditing}
                    name="hargasewa"
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center">
                  <img
                    src="/icons/profil2.png"
                    alt="Logo Data Pemilik"
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
                    name="namapemilik"
                    onChange={handleInputChange}
                  />
                  <DetailField
                    label="Kontak Pemilik"
                    value={editedData?.kontakpemilik || ""}
                    isEditing={isEditing}
                    name="kontakpemilik"
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <DetailMapCard id={initialData.id} />

            {isIntipDone && (
              <section className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mt-8">
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center">
                    <CheckCircle2 className="text-green-600 mr-3" size={20} />
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
                      isEditing={false}
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
                      isEditing={false}
                    />
                    <div className="col-span-1 md:col-span-2">
                      <p className="text-gray-600 font-medium text-sm mb-2 block">
                        Bukti Approval
                      </p>
                      {fileIntipUrl ? (
                        (() => {
                          const isImage =
                            initialData.file_intip &&
                            /\.(jpeg|jpg|gif|png|webp)$/i.test(
                              initialData.file_intip
                            );
                          if (isImage) {
                            return (
                              <a
                                href={fileIntipUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Klik untuk melihat ukuran penuh"
                              >
                                {" "}
                                <img
                                  src={fileIntipUrl}
                                  alt="Preview Bukti Approval"
                                  className="rounded-lg shadow-md max-w-xs max-h-60 object-contain border border-gray-200 cursor-pointer transition-transform hover:scale-105"
                                />
                              </a>
                            );
                          } else {
                            return (
                              <a
                                href={fileIntipUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-semibold transition-colors"
                              >
                                <FileText className="h-4 w-4" />
                                <span>
                                  Lihat File: {initialData.file_intip}
                                </span>
                              </a>
                            );
                          }
                        })()
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          Memuat file...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {isLocationManager && isPendingApproval && (
              <div className="mt-8 flex justify-end">
                {!isIntipDone ? (
                  <Button
                    onClick={onOpenIntipForm}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-3 text-base"
                    size="lg"
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
  );
}
