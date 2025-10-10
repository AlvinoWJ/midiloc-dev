"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/statusbadge";
import { useUser } from "@/hooks/useUser";
import { CheckCircle2, FileText, ArrowLeft, Edit3, MapPin } from "lucide-react";
import { ApprovalStatusbutton } from "@/components/ui/approvalbutton";
import DetailMapCard from "@/components/map/DetailMapCard";
import MobileNavbar from "./navbar";
import MobileSidebar from "./sidebar";
import { MappedUlokData } from "@/hooks/useUlokDetail";
import { UlokUpdateInput } from "@/lib/validations/ulok";
import { useDetailUlokForm } from "@/hooks/useDetailUlokForm";
import { MobileDetailUlokContentSkeleton } from "@/components/mobile/skleton";

interface DetailUlokProps {
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
  onChange,
  type = "text",
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
      <div className="text-gray-900 py-2 text-sm bg-gray-100 rounded-lg px-3 min-h-[40px] flex items-start w-full break-words">
        {value || "-"}
      </div>
    )}
  </div>
);

export default function MobileDetailUlokLayout(props: DetailUlokProps) {
  const {
    isLoading,
    initialData,
    onSave,
    isSubmitting,
    onOpenIntipForm,
    onApprove,
    fileIntipUrl,
  } = props;
  const router = useRouter();
  const { user } = useUser();
  const [isApproving, setIsApproving] = useState(false);

  // Hanya initialize hooks jika tidak loading
  const formHooks = !isLoading ? useDetailUlokForm(initialData, onSave) : null;

  const {
    isEditing,
    setIsEditing,
    editedData,
    handleInputChange,
    handleSaveWrapper,
    handleCancel,
  } = formHooks || {};

  // Render dengan navbar tetap ada
  return (
    <div className="bg-gray-50 min-h-screen">
      <MobileSidebar />
      <MobileNavbar />

      <main className="bg-gray-50 min-h-screen">
        {/* Jika sedang loading, tampilkan skeleton */}
        {isLoading ? (
          <MobileDetailUlokContentSkeleton />
        ) : (
          <>
            {/* Konten Normal setelah loading selesai */}
            <div className="px-4 py-4 space-y-6">
              <div className="flex justify-between items-center">
                <Button onClick={() => router.back()} variant="back">
                  <ArrowLeft size={20} className="mr-1" />
                  Kembali
                </Button>

                {user?.position_nama?.toLowerCase().trim() ===
                  "location specialist" &&
                  initialData.approval_status === "In Progress" && (
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
                          onClick={() => setIsEditing?.(true)}
                        >
                          <Edit3 size={16} className="mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  )}
              </div>

              {/* Title Card */}
              <div className="bg-white rounded-xl p-6 mb-8 shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex-1 pr-4 min-w-0">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 truncate">
                      {isEditing ? (
                        <Input
                          name="namaUlok"
                          value={editedData?.namaUlok || ""}
                          onChange={handleInputChange}
                          className="text-2xl font-bold ..."
                        />
                      ) : (
                        editedData?.namaUlok || "-"
                      )}
                    </h1>

                    <div className="flex items-center text-sm text-gray-500">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-2 flex-shrink-0"></div>
                      {/* Item 2: Pembungkus untuk semua teks (diberi truncate) */}
                      <div className="whitespace-nowrap">
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
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={initialData.approval_status} />
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
                      type="textarea"
                      name="alamat"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mt-4">
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
                      name="formatStore"
                      onChange={handleInputChange}
                    />
                    <DetailField
                      label="Bentuk Objek"
                      value={editedData?.bentukObjek || ""}
                      isEditing={isEditing}
                      name="bentukObjek"
                      onChange={handleInputChange}
                    />
                    <DetailField
                      label="Alas Hak"
                      value={editedData?.alasHak || ""}
                      isEditing={isEditing}
                      name="alasHak"
                      onChange={handleInputChange}
                    />
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
                      value={`${editedData?.lebardepan || ""} m`}
                      isEditing={isEditing}
                      type="number"
                      name="lebardepan"
                      onChange={handleInputChange}
                    />
                    <DetailField
                      label="Panjang"
                      value={`${editedData?.panjang || ""} m`}
                      isEditing={isEditing}
                      type="number"
                      name="panjang"
                      onChange={handleInputChange}
                    />
                    <DetailField
                      label="Luas"
                      value={`${editedData?.luas || ""} m2`}
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

              {/* Tampilkan kartu approval JIKA intip sudah selesai */}
              {initialData.file_intip && (
                <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
                  <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center">
                      <CheckCircle2 className="text-green-600 mr-3" size={18} />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Data Approval INTIP
                      </h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Status & Tanggal */}
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>

                    {/* Bukti Approval */}
                    <div>
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
                              >
                                <img
                                  src={fileIntipUrl}
                                  alt="Preview Bukti Approval"
                                  className="rounded-lg shadow-md w-full max-h-48 object-contain border border-gray-200"
                                />
                              </a>
                            );
                          } else {
                            return (
                              <a
                                href={fileIntipUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg text-sm text-red-600 hover:text-red-800 font-semibold"
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
              )}

              {user?.position_nama?.toLowerCase().trim() ===
                "location manager" &&
                initialData.approval_status === "In Progress" && (
                  <div className="mt-6">
                    {!initialData.file_intip ? (
                      <Button
                        onClick={onOpenIntipForm}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                        size="lg"
                        disabled={isSubmitting}
                      >
                        Input Data Intip
                      </Button>
                    ) : (
                      <ApprovalStatusbutton
                        currentStatus={initialData.approval_status}
                        show={true}
                        fileUploaded={true}
                        onApprove={async (status: "OK" | "NOK") => {
                          setIsApproving(true);
                          await onApprove(status);
                          setIsApproving(false);
                        }}
                        loading={isApproving}
                        disabled={isApproving}
                      />
                    )}
                  </div>
                )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
