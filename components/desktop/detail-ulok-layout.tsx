"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/input";
import { UlokUpdateSchema, UlokUpdateInput } from "@/lib/validations/ulok";
import { MapPin, CheckCircle2, FileText } from "lucide-react";
import { StatusBadge } from "@/components/ui/statusbadge";
import { useUser } from "@/hooks/useUser";
import DetailMapCard from "@/components/ui/detailmapcard";
import DetailActionButtons from "./detail-ulok-buttons";
import Sidebar from "@/components/desktop/sidebar";
import Navbar from "@/components/desktop/navbar";
import { useSidebar } from "@/hooks/useSidebar";
import { DetailUlokSkeleton } from "./skleton";

// Interface Data & Props (Sama seperti kode dasar Anda)
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
  approval_status: string;
  file_intip: string | null;
  approval_intip: string | null;
  tanggal_approval_intip: string | null;
}
interface DetailUlokLayoutProps {
  initialData: UlokData;
  onSave: (data: UlokUpdateInput) => Promise<boolean>;
  isSubmitting: boolean;
  onOpenIntipForm: () => void;
  onApprove: (status: "OK" | "NOK") => void;
  fileIntipUrl: string | null;
}

// Komponen DetailField (Sama seperti kode dasar Anda)
const DetailField = ({
  label,
  value,
  isEditing,
  name,
  onChange,
  type = "text",
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
      <div className="text-gray-900 py-2 text-sm bg-gray-50 rounded-lg px-3 min-h-[40px] flex items-start">
        {value || "-"}
      </div>
    )}
  </div>
);

export default function DetailUlokLayout(props: DetailUlokLayoutProps) {
  const {
    initialData,
    onSave,
    isSubmitting,
    onOpenIntipForm,
    onApprove,
    fileIntipUrl,
  } = props;
  const { isCollapsed } = useSidebar();

  // ===============================================
  // SEMUA STATE & LOGIKA DARI KODE DASAR ADA DI SINI
  // ===============================================
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const { user } = useUser();
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setEditedData(initialData);
    }
  }, [initialData]);

  // --- LOGIKA OTORISASI ---
  const isLocationManager =
    user?.position_nama?.toLowerCase().trim() === "location manager";
  const isLocationSpecialist =
    user?.position_nama?.toLowerCase().trim() === "location specialist";
  const isIntipDone = !!initialData.file_intip;
  const isPendingApproval = initialData.approval_status === "In Progress";

  // --- FUNGSI HANDLER ---
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
      const formattedErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        formattedErrors[String(issue.path[0])] = issue.message;
      });
      setErrors(formattedErrors);
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
          <div className="max-w-6xl mx-auto">
            <DetailActionButtons
              isLocationSpecialist={isLocationSpecialist}
              isLocationManager={isLocationManager}
              isEditing={isEditing}
              isSubmitting={isSubmitting}
              isApproving={isApproving}
              isIntipDone={isIntipDone}
              isPendingApproval={isPendingApproval}
              currentStatus={initialData.approval_status}
              onEdit={() => setIsEditing(true)}
              onSave={handleSaveWrapper}
              onCancel={handleCancel}
              onOpenIntipForm={onOpenIntipForm}
              onApprove={handleApproveAction}
            />

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
                      initialData.namaUlok || "-"
                    )}
                  </h1>
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                    <span>Dibuat Pada </span>
                    <span className="ml-1">
                      {new Date(
                        initialData.tanggalUlok || ""
                      ).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Status badge dengan flex-shrink-0 agar tidak mengecil */}
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
                    value={
                      isEditing ? editedData.provinsi : initialData.provinsi
                    }
                    isEditing={isEditing}
                    name="provinsi"
                    onChange={handleInputChange}
                  />
                  <DetailField
                    label="Kabupaten/Kota"
                    value={
                      isEditing ? editedData.kabupaten : initialData.kabupaten
                    }
                    isEditing={isEditing}
                    name="kabupaten"
                    onChange={handleInputChange}
                  />
                  <DetailField
                    label="Kecamatan"
                    value={
                      isEditing ? editedData.kecamatan : initialData.kecamatan
                    }
                    isEditing={isEditing}
                    name="kecamatan"
                    onChange={handleInputChange}
                  />
                  <DetailField
                    label="Kelurahan/Desa"
                    value={
                      isEditing ? editedData.kelurahan : initialData.kelurahan
                    }
                    isEditing={isEditing}
                    name="kelurahan"
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mt-4">
                  <DetailField
                    label="Alamat"
                    value={isEditing ? editedData.alamat : initialData.alamat}
                    isEditing={isEditing}
                    inputType="textarea"
                    name="alamat"
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mt-4">
                  <DetailField
                    label="LatLong"
                    value={isEditing ? editedData.latlong : initialData.latlong}
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
                    value={
                      isEditing
                        ? editedData.formatStore
                        : initialData.formatStore
                    }
                    isEditing={isEditing}
                    name="formatStore"
                    onChange={handleInputChange}
                  />
                  <DetailField
                    label="Bentuk Objek"
                    value={
                      isEditing
                        ? editedData.bentukObjek
                        : initialData.bentukObjek
                    }
                    isEditing={isEditing}
                    name="bentukObjek"
                    onChange={handleInputChange}
                  />
                  <DetailField
                    label="Alas Hak"
                    value={isEditing ? editedData.alasHak : initialData.alasHak}
                    isEditing={isEditing}
                    name="alasHak"
                    onChange={handleInputChange}
                  />
                  <DetailField
                    label="Jumlah Lantai"
                    value={
                      isEditing
                        ? editedData.jumlahlantai
                        : initialData.jumlahlantai
                    }
                    isEditing={isEditing}
                    inputType="number"
                    name="jumlahlantai"
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mt-4">
                  <DetailField
                    label="Lebar Depan"
                    value={
                      isEditing ? editedData.lebardepan : initialData.lebardepan
                    }
                    isEditing={isEditing}
                    inputType="number"
                    name="lebardepan"
                    onChange={handleInputChange}
                  />
                  <DetailField
                    label="Panjang"
                    value={isEditing ? editedData.panjang : initialData.panjang}
                    isEditing={isEditing}
                    inputType="number"
                    name="panjang"
                    onChange={handleInputChange}
                  />
                  <DetailField
                    label="Luas"
                    value={isEditing ? editedData.luas : initialData.luas}
                    isEditing={isEditing}
                    inputType="number"
                    name="luas"
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mt-4">
                  <DetailField
                    label="Harga Sewa (+PPH 10%)"
                    value={
                      isEditing ? editedData.hargasewa : initialData.hargasewa
                    }
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
                    value={
                      isEditing
                        ? editedData.namapemilik
                        : initialData.namapemilik
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
                        : initialData.kontakpemilik
                    }
                    isEditing={isEditing}
                    name="kontakpemilik"
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <DetailMapCard id={initialData.id} />

            {/* Kartu Approval INTIP - LOGIKA DIPERBAIKI */}
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
                    {/* Menampilkan Status INTIP */}
                    <DetailField
                      label="Status INTIP"
                      value={initialData.approval_intip || "-"}
                      isEditing={false}
                    />

                    {/* Menampilkan Tanggal Approval */}
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

                    {/* Menampilkan Link ke File Bukti Approval */}
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
                            // Jika file adalah gambar, tampilkan preview
                            return (
                              <a
                                href={fileIntipUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Klik untuk melihat ukuran penuh"
                              >
                                <img
                                  src={fileIntipUrl}
                                  alt="Preview Bukti Approval"
                                  className="rounded-lg shadow-md max-w-xs max-h-60 object-contain border border-gray-200 cursor-pointer transition-transform hover:scale-105"
                                />
                              </a>
                            );
                          } else {
                            // Jika bukan gambar, tampilkan link
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
          </div>
        </main>
      </div>
    </div>
  );
}
